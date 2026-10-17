import {
  calculateBill,
  mealNutrition,
  meetsMinimumOrder,
  SERVICE_FEE,
  type Ingredient,
  type MenuItem,
  type Piasters,
  type Suggestion,
} from '@lo2ma/core';
import { menu, restaurantById, restaurants } from '../data/restaurants';

export interface SuggestOptions {
  budget: Piasters;
  exclusions: readonly Ingredient[];
  caloriesMax?: number;
  /** Only meals cheaper than this total (for «أرخص من كده»). */
  below?: Piasters;
  /** Caps the food alone, for weekly plans where delivery is shared. */
  foodMax?: Piasters;
  /** Restaurants to skip, so a weekly plan doesn't repeat a place. */
  skipRestaurants?: ReadonlySet<string>;
  /** Main dishes to skip (by English name), so a weekly plan doesn't repeat a dish from another place. */
  skipDishes?: ReadonlySet<string>;
}

type Dish = (typeof menu)[number];

const allowed = (dish: MenuItem, exclusions: readonly Ingredient[]) =>
  dish.contains.every((ingredient) => !exclusions.includes(ingredient));

/** Encodes the dishes in the id, so a suggestion can be rebuilt from its URL: "r01.m1.m3". */
export function suggestionId(restaurantId: string, dishes: readonly Dish[]): string {
  return [restaurantId, ...dishes.map((dish) => dish.id.split('-')[1] ?? '')].join('.');
}

export function buildSuggestion(dishes: readonly Dish[], bestValue = false): Suggestion | null {
  const first = dishes[0];
  const restaurant = first && restaurantById.get(first.restaurantId);
  if (!first || !restaurant) return null;

  const items = dishes.map(({ role, recipe, ...dish }) => ({ ...dish, quantity: 1 }));
  return {
    id: suggestionId(restaurant.id, dishes),
    restaurant,
    items,
    bill: calculateBill({ items, delivery: restaurant.deliveryFee, service: SERVICE_FEE }),
    ...mealNutrition(items),
    bestValue,
  };
}

/** The menu dishes a suggestion id names, or null when one of them doesn't exist. */
export function dishesFromId(id: string): Dish[] | null {
  const [restaurantId, ...dishKeys] = id.split('.');
  const dishes = dishKeys.map((key) => menu.find((dish) => dish.id === `${restaurantId}-${key}`));
  if (!restaurantId || dishes.length === 0 || dishes.some((dish) => !dish)) return null;
  return dishes as Dish[];
}

export function suggestionFromId(id: string): Suggestion | null {
  const dishes = dishesFromId(id);
  return dishes && buildSuggestion(dishes);
}

/**
 * Up to `limit` meals within the budget, cheapest first. Each restaurant offers its fullest meal that fits:
 * a main with a side when the money allows, otherwise the main alone.
 */
export function suggestMeals(options: SuggestOptions, limit = 3): Suggestion[] {
  const picks: Suggestion[] = [];

  for (const restaurant of restaurants) {
    if (options.skipRestaurants?.has(restaurant.id)) continue;
    const dishes = menu.filter(
      (dish) => dish.restaurantId === restaurant.id && allowed(dish, options.exclusions),
    );
    const mains = dishes.filter(
      (dish) => dish.role === 'main' && !options.skipDishes?.has(dish.name.en),
    );
    const sides = dishes.filter((dish) => dish.role === 'side');

    const combos = mains.flatMap((main) => [[main, ...sides.slice(0, 1)], [main]]);
    const fits = combos
      .map((combo) => buildSuggestion(combo))
      .filter((meal): meal is Suggestion => {
        if (!meal || !meetsMinimumOrder(meal.bill.food)) return false;
        if (meal.bill.total > options.budget) return false;
        if (options.below !== undefined && meal.bill.total >= options.below) return false;
        if (options.foodMax !== undefined && meal.bill.food > options.foodMax) return false;
        return options.caloriesMax === undefined || meal.kcal <= options.caloriesMax;
      })
      .sort((a, b) => b.items.length - a.items.length || a.bill.total - b.bill.total);

    if (fits[0]) picks.push(fits[0]);
  }

  return picks
    .sort(
      (a, b) => a.bill.total - b.bill.total || a.restaurant.distanceKm - b.restaurant.distanceKm,
    )
    .slice(0, limit)
    .map((meal, index) => ({ ...meal, bestValue: index === 0 }));
}
