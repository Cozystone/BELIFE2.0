CREATE TABLE "native_auth_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"display_name" text NOT NULL,
	"password_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "native_auth_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "native_auth_sessions" ADD CONSTRAINT "native_auth_sessions_account_id_native_auth_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."native_auth_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "native_auth_accounts_email_idx" ON "native_auth_accounts" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "native_auth_sessions_token_hash_idx" ON "native_auth_sessions" USING btree ("token_hash");