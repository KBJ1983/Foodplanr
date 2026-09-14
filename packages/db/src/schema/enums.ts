import { pgEnum } from 'drizzle-orm/pg-core';

export const legalStatusEnum = pgEnum('legal_status', ['approved', 'pending', 'blocked', 'open']);
export const recipeStatusEnum = pgEnum('recipe_status', ['draft', 'review', 'published']);
export const recipeOriginEnum = pgEnum('recipe_origin', ['own', 'licensed']);
export const unitPriceKindEnum = pgEnum('unit_price_kind', ['exact', 'range_max', 'pcs', 'unknown']);
export const normalizedByEnum = pgEnum('normalized_by', ['rule', 'llm', 'manual']);
export const offerKindEnum = pgEnum('offer_kind', ['weekly', 'food_waste']);
export const checkoutModeEnum = pgEnum('checkout_mode', ['copy_list', 'deeplink_list', 'partner_api']);
export const userPlanEnum = pgEnum('user_plan', ['free', 'pro']);
export const mealPlanStatusEnum = pgEnum('meal_plan_status', ['draft', 'active', 'archived']);
