"""The rules the server shares with the apps, generated from packages/core.

Don't edit this file: change packages/core, then run `npm run export:python -w @lo2ma/core`. Its
tests fail while this file is out of date.
"""

from typing import Final

# packages/core/src/rules.ts
MIN_ORDER: Final = 10000
SERVICE_FEE: Final = 1000
SHARED_DELIVERY_FEE: Final = 1000
ARRIVAL_BUFFER_MINUTES: Final = 15
PLAN_CHANGE_CUTOFF: Final = "11:30"
PLAN_SEND_LEAD_MINUTES: Final = 45
VOICE_MAX_BYTES: Final = 4194304
SERVICE_AREA_CENTER_LAT: Final = 30.0444
SERVICE_AREA_CENTER_LNG: Final = 31.2357
SERVICE_AREA_RADIUS_METERS: Final = 35000
DELIVERY_RADIUS_METERS: Final = 5000
WORKPLACE_DETAILS_MAX: Final = 120

# packages/core/src/schemas/fit.ts
FIT_LUNCH_LIMITS_KCAL_MIN: Final = 300
FIT_LUNCH_LIMITS_KCAL_MAX: Final = 1500
FIT_LUNCH_LIMITS_KCAL_STEP: Final = 50
FIT_LUNCH_LIMITS_PROTEIN_MIN: Final = 10
FIT_LUNCH_LIMITS_PROTEIN_MAX: Final = 120
FIT_LUNCH_LIMITS_PROTEIN_STEP: Final = 5

# packages/core/src/schemas/auth.ts
OTP_LENGTH: Final = 6
