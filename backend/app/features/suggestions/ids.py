"""A suggestion's id names its meal: the restaurant, then each dish's key on its menu.

"r01.m1.m4" is r01's dishes r01-m1 and r01-m4. Any meal opens from its id alone, as the apps' links
do (the mock's suggestionId), and the server always rebuilds it from today's menu.
"""

# Far more dishes than a meal has (a main and a side). It only keeps a made-up id small.
_MOST_DISHES = 10


def dish_ids_of(suggestion_id: str) -> tuple[str, list[str]] | None:
    """The restaurant and the dish ids a suggestion's id names, or None when it names none."""
    restaurant_id, *keys = suggestion_id.split(".")
    if not restaurant_id or not keys or len(keys) > _MOST_DISHES:
        return None
    return restaurant_id, [f"{restaurant_id}-{key}" for key in keys]
