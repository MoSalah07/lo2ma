"""Every error leaves the API as a status and {"code": "..."}. The apps turn the code into text."""

import logging
from collections.abc import Mapping

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi.routing import APIRoute
from starlette.exceptions import HTTPException

logger = logging.getLogger(__name__)

INVALID_CODE_KEY = "x-invalid-code"


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


def invalid_input(code: str) -> dict[str, str]:
    """A route's `openapi_extra`: the code a malformed request gets, such as invalid_prefs."""
    return {INVALID_CODE_KEY: code}


def error_response(
    status: int, code: str, headers: Mapping[str, str] | None = None
) -> JSONResponse:
    return JSONResponse({"code": code}, status_code=status, headers=headers)


def invalid_input_code(request: Request) -> str:
    """The code the matched route declared with `invalid_input`, or the general one."""
    route = request.scope.get("route")
    extra = route.openapi_extra if isinstance(route, APIRoute) else None
    code = extra.get(INVALID_CODE_KEY) if extra else None
    return code if isinstance(code, str) else "invalid_request"


def install_error_handlers(app: FastAPI) -> None:
    @app.exception_handler(DomainError)
    async def domain_error(_request: Request, error: DomainError) -> JSONResponse:
        return error_response(error.status, error.code)

    @app.exception_handler(RequestValidationError)
    async def invalid_request(request: Request, error: RequestValidationError) -> JSONResponse:
        # Where and why, never the values: they can be phone numbers or messages.
        problems = [(problem["loc"], problem["type"]) for problem in error.errors()]
        logger.info("Invalid request to %s %s: %s", request.method, request.url.path, problems)
        return error_response(400, invalid_input_code(request))

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
