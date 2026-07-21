<!-- title: MAYA_X_2.0 — Entity-Relationship Diagram -->

# MAYA_X_2.0 — Entity-Relationship Diagram

_Production database schema · PostgreSQL · v1.0 draft_

Companion diagram to the full **Database Design Document** (DOCX). 21 entities across seven domains: Identity & Access, Talent Catalog, Booking, Membership, Payment, Notification, and Audit. See the design document for column-level data types, constraints, index strategy, and rationale — this view is for structure and relationships only.

```mermaid
erDiagram
    ROLES {
        uuid id PK
        text name
        text description
    }
    ADMIN_USERS {
        uuid id PK
        citext email
        text full_name
        boolean is_active
        timestamptz created_at
        timestamptz updated_at
        timestamptz deleted_at
    }
    ADMIN_USER_ROLES {
        uuid admin_user_id PK,FK
        uuid role_id PK,FK
    }
    USERS {
        uuid id PK
        citext email
        text full_name
        text phone
        timestamptz email_verified_at
        timestamptz created_at
        timestamptz updated_at
        timestamptz deleted_at
    }
    USER_CREDENTIALS {
        uuid user_id PK,FK
        text password_hash
        int failed_login_attempts
        timestamptz locked_until
        timestamptz password_changed_at
    }
    PASSWORD_RESET_TOKENS {
        uuid id PK
        uuid user_id FK
        text token_hash
        timestamptz expires_at
        timestamptz used_at
        timestamptz created_at
    }
    REFRESH_TOKENS {
        uuid id PK
        uuid user_id FK
        uuid admin_user_id FK
        text token_hash
        timestamptz expires_at
        timestamptz revoked_at
        timestamptz created_at
    }
    TALENT_CATEGORIES {
        uuid id PK
        text name
        text slug
        int display_order
    }
    TALENTS {
        uuid id PK
        text display_name
        text slug
        text bio
        text status
        uuid created_by FK
        uuid updated_by FK
        tsvector search_vector
        timestamptz created_at
        timestamptz updated_at
        timestamptz deleted_at
    }
    TALENT_CATEGORY_MAP {
        uuid talent_id PK,FK
        uuid category_id PK,FK
    }
    MEDIA_ASSETS {
        uuid id PK
        text owner_type
        uuid owner_id FK
        text cloudinary_public_id
        text url
        text asset_type
        jsonb metadata
        int display_order
        timestamptz created_at
        timestamptz deleted_at
    }
    WISHLISTS {
        uuid user_id PK,FK
        uuid talent_id PK,FK
        timestamptz created_at
    }
    BOOKING_REQUESTS {
        uuid id PK
        uuid user_id FK
        uuid talent_id FK
        text guest_name
        text guest_email
        text guest_phone
        text status
        date event_date
        text event_details
        timestamptz created_at
        timestamptz updated_at
        timestamptz deleted_at
    }
    BOOKING_STATUS_HISTORY {
        uuid id PK
        uuid booking_request_id FK
        uuid admin_user_id FK
        text previous_status
        text new_status
        text notes
        timestamptz created_at
    }
    MEMBERSHIP_PLANS {
        uuid id PK
        text name
        text slug
        numeric price
        char currency
        text billing_cycle
        jsonb benefits
        boolean is_active
        uuid created_by FK
        timestamptz created_at
        timestamptz updated_at
        timestamptz deleted_at
    }
    SUBSCRIPTIONS {
        uuid id PK
        uuid user_id FK
        uuid membership_plan_id FK
        text status
        numeric price_at_purchase
        timestamptz starts_at
        timestamptz expires_at
        timestamptz cancelled_at
        timestamptz created_at
        timestamptz updated_at
    }
    PAYMENTS {
        uuid id PK
        uuid user_id FK
        uuid subscription_id FK
        uuid booking_request_id FK
        text razorpay_order_id
        text razorpay_payment_id
        numeric amount
        char currency
        text status
        jsonb gateway_response
        timestamptz created_at
        timestamptz updated_at
    }
    COUPONS {
        uuid id PK
        text code
        text discount_type
        numeric discount_value
        int max_redemptions
        int redemption_count
        timestamptz valid_from
        timestamptz valid_until
        uuid created_by FK
        timestamptz created_at
        timestamptz deleted_at
    }
    COUPON_REDEMPTIONS {
        uuid id PK
        uuid coupon_id FK
        uuid payment_id FK
        numeric discount_applied
        timestamptz created_at
    }
    NOTIFICATION_TEMPLATES {
        uuid id PK
        text code
        text channel
        text subject
        text body_template
        boolean is_active
    }
    NOTIFICATIONS {
        uuid id PK
        uuid user_id FK
        uuid admin_user_id FK
        uuid template_id FK
        text channel
        text status
        jsonb payload
        timestamptz sent_at
        timestamptz created_at
    }
    AUDIT_LOGS {
        uuid id PK
        text actor_type
        uuid actor_id
        text entity_type
        uuid entity_id
        text action
        jsonb old_value
        jsonb new_value
        timestamptz created_at
    }

    ROLES ||--o{ ADMIN_USER_ROLES : "assigned"
    ADMIN_USERS ||--o{ ADMIN_USER_ROLES : "has"
    ADMIN_USERS ||--o{ TALENTS : "manages"
    ADMIN_USERS ||--o{ MEMBERSHIP_PLANS : "manages"
    ADMIN_USERS ||--o{ COUPONS : "manages"
    ADMIN_USERS ||--o{ BOOKING_STATUS_HISTORY : "actions"
    ADMIN_USERS ||--o{ REFRESH_TOKENS : "holds"
    ADMIN_USERS ||--o{ NOTIFICATIONS : "receives"
    USERS ||--|| USER_CREDENTIALS : "secures"
    USERS ||--o{ PASSWORD_RESET_TOKENS : "requests"
    USERS ||--o{ REFRESH_TOKENS : "holds"
    USERS ||--o{ WISHLISTS : "saves"
    TALENTS ||--o{ WISHLISTS : "saved as"
    USERS ||--o{ BOOKING_REQUESTS : "submits"
    TALENTS ||--o{ BOOKING_REQUESTS : "receives"
    BOOKING_REQUESTS ||--o{ BOOKING_STATUS_HISTORY : "has"
    TALENTS ||--o{ TALENT_CATEGORY_MAP : "tagged"
    TALENT_CATEGORIES ||--o{ TALENT_CATEGORY_MAP : "groups"
    TALENTS ||--o{ MEDIA_ASSETS : "has (owner_type=talent)"
    MEMBERSHIP_PLANS ||--o{ SUBSCRIPTIONS : "sold as"
    USERS ||--o{ SUBSCRIPTIONS : "holds"
    USERS ||--o{ PAYMENTS : "makes"
    SUBSCRIPTIONS ||--o{ PAYMENTS : "paid via"
    BOOKING_REQUESTS ||--o{ PAYMENTS : "paid via (future scope)"
    COUPONS ||--o{ COUPON_REDEMPTIONS : "redeemed as"
    PAYMENTS ||--o{ COUPON_REDEMPTIONS : "applies"
    NOTIFICATION_TEMPLATES ||--o{ NOTIFICATIONS : "renders"
    USERS ||--o{ NOTIFICATIONS : "receives"
```

### Reading the diagram

| Notation                         | Meaning                                                                                                                                                  |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `\|\|--\|\|`                     | One-to-one — `USERS ↔ USER_CREDENTIALS`, the only true 1:1 in the schema (security-sensitive columns isolated from the hot `users` row).                 |
| `\|\|--o{`                       | One-to-many — the majority of relationships (e.g., one `TALENT` has many `BOOKING_REQUESTS`).                                                            |
| Two `\|\|--o{` into a join table | Many-to-many — `TALENTS ↔ TALENT_CATEGORIES` via `TALENT_CATEGORY_MAP`, `USERS ↔ TALENTS` via `WISHLISTS`, `ADMIN_USERS ↔ ROLES` via `ADMIN_USER_ROLES`. |

`PAYMENTS` carries two nullable foreign keys (`subscription_id`, `booking_request_id`) with a check constraint enforcing exactly one is set — modeling today's confirmed payable (membership) while leaving room for booking-linked payment once that SRS open question is resolved, without a schema change.

`MEDIA_ASSETS` and `AUDIT_LOGS` use a polymorphic `owner_type` / `entity_type` + id pair rather than a dedicated FK per owning table, since both are designed to attach to more than one entity type.
