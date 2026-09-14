CREATE TYPE "public"."checkout_mode" AS ENUM('copy_list', 'deeplink_list', 'partner_api');--> statement-breakpoint
CREATE TYPE "public"."legal_status" AS ENUM('approved', 'pending', 'blocked', 'open');--> statement-breakpoint
CREATE TYPE "public"."meal_plan_status" AS ENUM('draft', 'active', 'archived');--> statement-breakpoint
CREATE TYPE "public"."normalized_by" AS ENUM('rule', 'llm', 'manual');--> statement-breakpoint
CREATE TYPE "public"."offer_kind" AS ENUM('weekly', 'food_waste');--> statement-breakpoint
CREATE TYPE "public"."recipe_origin" AS ENUM('own', 'licensed');--> statement-breakpoint
CREATE TYPE "public"."recipe_status" AS ENUM('draft', 'review', 'published');--> statement-breakpoint
CREATE TYPE "public"."unit_price_kind" AS ENUM('exact', 'range_max', 'pcs', 'unknown');--> statement-breakpoint
CREATE TYPE "public"."user_plan" AS ENUM('free', 'pro');--> statement-breakpoint
CREATE TABLE "source_registry" (
	"source" text PRIMARY KEY NOT NULL,
	"display_name" text NOT NULL,
	"legal_status" "legal_status" NOT NULL,
	"approved_fields" text[] NOT NULL,
	"attribution" text,
	"agreement_ref" text,
	"reviewed_at" date NOT NULL,
	"note" text DEFAULT '' NOT NULL,
	"last_sync_at" timestamp with time zone,
	"last_error" text
);
--> statement-breakpoint
CREATE TABLE "ingredient" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name_da" text NOT NULL,
	"name_en" text,
	"frida_food_id" integer,
	"category" text,
	"default_unit" text DEFAULT 'g' NOT NULL,
	"density_g_per_ml" numeric(6, 3),
	"grams_per_piece" numeric(8, 2),
	"default_price_per_unit" numeric(10, 2),
	"aliases" text[] DEFAULT '{}' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ingredient_nutrition" (
	"ingredient_id" uuid PRIMARY KEY NOT NULL,
	"kcal_100g" numeric(7, 2),
	"kj_100g" numeric(8, 2),
	"protein_g" numeric(6, 2),
	"fat_g" numeric(6, 2),
	"carb_g" numeric(6, 2),
	"fiber_g" numeric(6, 2),
	"source" text NOT NULL,
	"source_version" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "app_user" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"plan" "user_plan" DEFAULT 'free' NOT NULL,
	"is_admin" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "app_user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "entitlement" (
	"plan" "user_plan" PRIMARY KEY NOT NULL,
	"max_saved_plans" integer NOT NULL,
	"max_weeks_ahead" integer NOT NULL,
	"lunchbox" boolean DEFAULT false NOT NULL,
	"templates_catalog" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recipe" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"servings_base" integer DEFAULT 4 NOT NULL,
	"prep_min" integer,
	"tags" text[] DEFAULT '{}' NOT NULL,
	"status" "recipe_status" DEFAULT 'draft' NOT NULL,
	"author_id" uuid,
	"origin" "recipe_origin" DEFAULT 'own' NOT NULL,
	"license_ref" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "recipe_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "recipe_ingredient" (
	"recipe_id" uuid NOT NULL,
	"ingredient_id" uuid NOT NULL,
	"qty" numeric(10, 3) NOT NULL,
	"unit" text NOT NULL,
	"optional" boolean DEFAULT false NOT NULL,
	"group" text,
	"ord" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "recipe_ingredient_recipe_id_ingredient_id_ord_pk" PRIMARY KEY("recipe_id","ingredient_id","ord")
);
--> statement-breakpoint
CREATE TABLE "recipe_nutrition" (
	"recipe_id" uuid PRIMARY KEY NOT NULL,
	"kcal_per_serving" numeric(8, 1),
	"protein_g" numeric(7, 1),
	"fat_g" numeric(7, 1),
	"carb_g" numeric(7, 1),
	"fiber_g" numeric(7, 1),
	"computed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recipe_step" (
	"recipe_id" uuid NOT NULL,
	"ord" integer NOT NULL,
	"text" text NOT NULL,
	CONSTRAINT "recipe_step_recipe_id_ord_pk" PRIMARY KEY("recipe_id","ord")
);
--> statement-breakpoint
CREATE TABLE "offer" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source" text NOT NULL,
	"source_id" text NOT NULL,
	"retailer_id" uuid NOT NULL,
	"store_id" uuid,
	"catalog_id" text,
	"heading" text NOT NULL,
	"price" numeric(10, 2) NOT NULL,
	"price_before" numeric(10, 2),
	"currency" text DEFAULT 'DKK' NOT NULL,
	"run_from" timestamp with time zone NOT NULL,
	"run_till" timestamp with time zone NOT NULL,
	"size_min" numeric(12, 4),
	"size_max" numeric(12, 4),
	"size_unit" text,
	"pieces" numeric(8, 2),
	"unit_price_dkk" numeric(12, 4),
	"unit_price_kind" "unit_price_kind" DEFAULT 'unknown' NOT NULL,
	"ean" text,
	"ingredient_id" uuid,
	"match_confidence" real,
	"normalized_by" "normalized_by" DEFAULT 'rule' NOT NULL,
	"kind" "offer_kind" DEFAULT 'weekly' NOT NULL,
	"bundle_index" integer DEFAULT 0 NOT NULL,
	"ingested_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "price_history" (
	"ingredient_id" uuid NOT NULL,
	"retailer_id" uuid NOT NULL,
	"date" date NOT NULL,
	"unit_price_dkk" numeric(12, 4) NOT NULL,
	"source" text NOT NULL,
	CONSTRAINT "price_history_ingredient_id_retailer_id_date_source_pk" PRIMARY KEY("ingredient_id","retailer_id","date","source")
);
--> statement-breakpoint
CREATE TABLE "retailer" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"tjek_dealer_id" text,
	"salling_brand" text,
	"checkout_mode" "checkout_mode" DEFAULT 'copy_list' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "retailer_slug_unique" UNIQUE("slug"),
	CONSTRAINT "retailer_tjek_dealer_id_unique" UNIQUE("tjek_dealer_id"),
	CONSTRAINT "retailer_salling_brand_unique" UNIQUE("salling_brand")
);
--> statement-breakpoint
CREATE TABLE "store" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"retailer_id" uuid NOT NULL,
	"source" text NOT NULL,
	"external_id" text NOT NULL,
	"zip" text,
	"lat" real,
	"lng" real
);
--> statement-breakpoint
CREATE TABLE "meal_plan" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"template_id" uuid,
	"week_start" date NOT NULL,
	"persons" integer NOT NULL,
	"kcal_target" integer NOT NULL,
	"budget" numeric(10, 2),
	"retailer_ids" uuid[] DEFAULT '{}' NOT NULL,
	"days" jsonb NOT NULL,
	"status" "meal_plan_status" DEFAULT 'draft' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "meal_plan_template" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"tags" text[] DEFAULT '{}' NOT NULL,
	"week_pattern" jsonb NOT NULL,
	"target_kcal" integer,
	"target_persons" integer,
	"is_public" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shopping_list" (
	"meal_plan_id" uuid NOT NULL,
	"retailer_id" uuid NOT NULL,
	"lines" jsonb NOT NULL,
	"est_total_dkk" numeric(10, 2),
	"generated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "shopping_list_meal_plan_id_retailer_id_pk" PRIMARY KEY("meal_plan_id","retailer_id")
);
--> statement-breakpoint
ALTER TABLE "ingredient_nutrition" ADD CONSTRAINT "ingredient_nutrition_ingredient_id_ingredient_id_fk" FOREIGN KEY ("ingredient_id") REFERENCES "public"."ingredient"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe" ADD CONSTRAINT "recipe_author_id_app_user_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."app_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe_ingredient" ADD CONSTRAINT "recipe_ingredient_recipe_id_recipe_id_fk" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipe"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe_ingredient" ADD CONSTRAINT "recipe_ingredient_ingredient_id_ingredient_id_fk" FOREIGN KEY ("ingredient_id") REFERENCES "public"."ingredient"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe_nutrition" ADD CONSTRAINT "recipe_nutrition_recipe_id_recipe_id_fk" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipe"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe_step" ADD CONSTRAINT "recipe_step_recipe_id_recipe_id_fk" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipe"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offer" ADD CONSTRAINT "offer_retailer_id_retailer_id_fk" FOREIGN KEY ("retailer_id") REFERENCES "public"."retailer"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offer" ADD CONSTRAINT "offer_store_id_store_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."store"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offer" ADD CONSTRAINT "offer_ingredient_id_ingredient_id_fk" FOREIGN KEY ("ingredient_id") REFERENCES "public"."ingredient"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "price_history" ADD CONSTRAINT "price_history_ingredient_id_ingredient_id_fk" FOREIGN KEY ("ingredient_id") REFERENCES "public"."ingredient"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "price_history" ADD CONSTRAINT "price_history_retailer_id_retailer_id_fk" FOREIGN KEY ("retailer_id") REFERENCES "public"."retailer"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "store" ADD CONSTRAINT "store_retailer_id_retailer_id_fk" FOREIGN KEY ("retailer_id") REFERENCES "public"."retailer"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meal_plan" ADD CONSTRAINT "meal_plan_user_id_app_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."app_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meal_plan" ADD CONSTRAINT "meal_plan_template_id_meal_plan_template_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."meal_plan_template"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shopping_list" ADD CONSTRAINT "shopping_list_meal_plan_id_meal_plan_id_fk" FOREIGN KEY ("meal_plan_id") REFERENCES "public"."meal_plan"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shopping_list" ADD CONSTRAINT "shopping_list_retailer_id_retailer_id_fk" FOREIGN KEY ("retailer_id") REFERENCES "public"."retailer"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "ingredient_frida_food_id_uq" ON "ingredient" USING btree ("frida_food_id");--> statement-breakpoint
CREATE INDEX "ingredient_name_da_idx" ON "ingredient" USING btree ("name_da");--> statement-breakpoint
CREATE INDEX "recipe_status_idx" ON "recipe" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "offer_source_source_id_uq" ON "offer" USING btree ("source","source_id");--> statement-breakpoint
CREATE INDEX "offer_retailer_run_till_idx" ON "offer" USING btree ("retailer_id","run_till");--> statement-breakpoint
CREATE INDEX "offer_ingredient_idx" ON "offer" USING btree ("ingredient_id");--> statement-breakpoint
CREATE INDEX "offer_unmatched_idx" ON "offer" USING btree ("match_confidence");--> statement-breakpoint
CREATE UNIQUE INDEX "store_source_external_uq" ON "store" USING btree ("source","external_id");