"""Every error leaves the API as a status and {"code": "..."}. The apps turn the code into text."""

import logging
from collections.abc import Mapping
from typing import Any

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi.routing import APIRoute
from starlette.exceptions import HTTPException

from app.core.api_model import ApiModel

logger = logging.getLogger(__name__)

INVALID_CODE_KEY = "x-invalid-code"
INVALID_STATUS_KEY = "x-invalid-status"


class ApiError(ApiModel):
    """What every error carries: a code the apps turn into text (the web's lib/api.ts reads it)."""

    code: str


class DomainError(Exception):
    """A rule was broken. Each subclass sets its status and code once; services only raise it."""

    status: int = 400
    code: str = "invalid_request"


class InvalidRequestError(DomainError):
    """The request is well formed, but makes no sense (a code for an impossible phone number)."""


class AuthRequiredError(DomainError):
    """Only a signed-in user may do this (paying, for one)."""

    status = 401
    code = "auth_required"


class AdminRequiredError(DomainError):
    """Only a signed-in admin may see this. A customer's session doesn't count."""

    status = 401
    code = "admin_required"


class SignedOutError(DomainError):
    """Asked who is signed in, and no one is: a customer's or an admin's session."""

    status = 401
    code = "signed_out"


class InvalidCodeError(DomainError):
    """A sign-in code (a customer's one-time code, an admin's authenticator) that doesn't match."""

    code = "invalid_code"


def invalid_input(code: str, status: int = 400) -> dict[str, str | int]:
    """A route's `openapi_extra`: the code a malformed request gets, such as invalid_prefs, and its
    status when the contract says it isn't 400 (a malformed admin sign-in is 401)."""
    return {INVALID_CODE_KEY: code, INVALID_STATUS_KEY: status}


def error_response(
    status: int, code: str, headers: Mapping[str, str] | None = None
) -> JSONResponse:
    return JSONResponse({"code": code}, status_code=status, headers=headers)


def invalid_input_answer(request: Request) -> tuple[int, str]:
    """What the matched route declared with `invalid_input`, or 400 invalid_request."""
    route = request.scope.get("route")
    extra = (route.openapi_extra if isinstance(route, APIRoute) else None) or {}
    code, status = extra.get(INVALID_CODE_KEY), extra.get(INVALID_STATUS_KEY)
    return (
        status if isinstance(status, int) else 400,
        code if isinstance(code, str) else "invalid_request",
    )


def install_error_handlers(app: FastAPI) -> None:
    @app.exception_handler(DomainError)
    async def domain_error(_request: Request, error: DomainError) -> JSONResponse:
        return error_response(error.status, error.code)

    @app.exception_handler(RequestValidationError)
    async def invalid_request(request: Request, error: RequestValidationError) -> JSONResponse:
        # Where and why, never the values: they can be phone numbers or messages.
        problems = [(problem["loc"], problem["type"]) for problem in error.errors()]
        logger.info("Invalid request to %s %s: %s", request.method, request.url.path, problems)
        return error_response(*invalid_input_answer(request))

    @app.exception_handler(HTTPException)
    async def http_error(_request: Request, error: HTTPException) -> JSONResponse:
        # An unknown path or a wrong method. 405 keeps its Allow header.
        code = "not_found" if error.status_code == 404 else "invalid_request"
        return error_response(error.status_code, code, error.headers)

    @app.exception_handler(Exception)
    async def unexpected_error(_request: Request, _error: Exception) -> JSONResponse:
        # Nothing about the error goes out: it can hold SQL, paths or keys. Starlette raises it
        # again after this response, so the server logs it with its traceback.
        return error_response(500, "internal_error")


def describe_errors(app: FastAPI) -> None:
    """Makes the OpenAPI schema say what the API really answers: never FastAPI's 422, and every
    status an operation doesn't list is an ApiError. A route's own code for a malformed request is
    in its `x-invalid-code`."""
    generate = app.openapi
    error = {"$ref": "#/components/schemas/ApiError"}

    def openapi() -> dict[str, Any]:
        if app.openapi_schema is not None:
            return app.openapi_schema
        # FastAPI keeps what it generates as app.openapi_schema; it's changed in place.
        schema = generate()
        for operations in schema["paths"].values():
            for operation in operations.values():
                responses = operation["responses"]
                responses.pop("422", None)
                responses["default"] = {
                    "description": "An error, by its code",
                    "content": {"application/json": {"schema": error}},
                }
        schemas = schema.setdefault("components", {}).setdefault("schemas", {})
        for unused in ("HTTPValidationError", "ValidationError"):
            schemas.pop(unused, None)
        schemas["ApiError"] = ApiError.model_json_schema()
        return schema

    app.openapi = openapi
