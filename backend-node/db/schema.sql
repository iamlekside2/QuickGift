--
-- PostgreSQL database dump
--

\restrict 0uJaSgDsBOfkiKOEugkzmv7DvxMaUkEZHgsUM2M3KzJeXVS6IAMXboV5IKIAiud

-- Dumped from database version 18.4
-- Dumped by pg_dump version 18.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: bank_accounts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.bank_accounts (
    id character varying NOT NULL,
    user_id character varying NOT NULL,
    bank_name character varying(100) NOT NULL,
    bank_code character varying(10) NOT NULL,
    account_number character varying(20) NOT NULL,
    account_name character varying(200) NOT NULL,
    is_default boolean NOT NULL,
    is_verified boolean NOT NULL,
    created_at timestamp without time zone NOT NULL
);


--
-- Name: bookings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.bookings (
    id character varying NOT NULL,
    booking_number character varying(20) NOT NULL,
    user_id character varying NOT NULL,
    provider_id character varying NOT NULL,
    service_id character varying NOT NULL,
    service_name character varying(200) NOT NULL,
    service_type character varying(20) NOT NULL,
    status character varying(20) NOT NULL,
    booking_date timestamp without time zone NOT NULL,
    booking_time character varying(10) NOT NULL,
    duration_minutes integer NOT NULL,
    price double precision NOT NULL,
    deposit double precision NOT NULL,
    commission double precision NOT NULL,
    address text,
    lat double precision,
    lng double precision,
    notes text,
    payment_ref character varying(100),
    payment_status character varying(20) NOT NULL,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL
);


--
-- Name: categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.categories (
    id character varying NOT NULL,
    name character varying(100) NOT NULL,
    icon character varying(10),
    description character varying(500),
    is_active boolean NOT NULL,
    sort_order integer NOT NULL,
    created_at timestamp without time zone NOT NULL
);


--
-- Name: conversations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.conversations (
    id character varying NOT NULL,
    buyer_id character varying NOT NULL,
    provider_id character varying NOT NULL,
    provider_name character varying(200) NOT NULL,
    last_message text,
    last_message_at timestamp without time zone,
    created_at timestamp without time zone NOT NULL
);


--
-- Name: deliveries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.deliveries (
    id character varying NOT NULL,
    order_id character varying NOT NULL,
    user_id character varying NOT NULL,
    kwik_order_id character varying(100),
    kwik_job_id character varying(100),
    status character varying(20) NOT NULL,
    pickup_address text,
    pickup_lat double precision,
    pickup_lng double precision,
    pickup_name character varying(200),
    pickup_phone character varying(20),
    delivery_address text,
    delivery_lat double precision,
    delivery_lng double precision,
    delivery_name character varying(200),
    delivery_phone character varying(20),
    delivery_fee double precision NOT NULL,
    vehicle_type character varying(20) NOT NULL,
    dispatched_at timestamp without time zone,
    picked_up_at timestamp without time zone,
    delivered_at timestamp without time zone,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL
);


--
-- Name: disputes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.disputes (
    id character varying NOT NULL,
    order_id character varying,
    booking_id character varying,
    buyer_id character varying NOT NULL,
    provider_id character varying,
    reason character varying(50) NOT NULL,
    description text,
    evidence_urls text,
    provider_response text,
    provider_evidence_urls text,
    status character varying(20) NOT NULL,
    resolution_notes text,
    resolved_by character varying,
    refund_amount double precision NOT NULL,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL
);


--
-- Name: feedback; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.feedback (
    id character varying NOT NULL,
    user_id character varying,
    user_name character varying(100),
    category character varying(30),
    rating integer,
    message text NOT NULL,
    app_version character varying(20),
    status character varying(20) NOT NULL,
    created_at timestamp without time zone NOT NULL
);


--
-- Name: messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.messages (
    id character varying NOT NULL,
    conversation_id character varying NOT NULL,
    sender_role character varying(20) NOT NULL,
    text text NOT NULL,
    created_at timestamp without time zone NOT NULL
);


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notifications (
    id character varying NOT NULL,
    user_id character varying NOT NULL,
    title character varying(200) NOT NULL,
    description text,
    type character varying(20) NOT NULL,
    is_read boolean NOT NULL,
    created_at timestamp without time zone NOT NULL
);


--
-- Name: occasions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.occasions (
    id character varying NOT NULL,
    name character varying(100) NOT NULL,
    icon character varying(10),
    color character varying(10),
    is_active boolean NOT NULL,
    sort_order integer NOT NULL
);


--
-- Name: order_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.order_items (
    id character varying NOT NULL,
    order_id character varying NOT NULL,
    product_id character varying NOT NULL,
    product_name character varying(200) NOT NULL,
    vendor_name character varying(200) NOT NULL,
    quantity integer NOT NULL,
    unit_price double precision NOT NULL,
    total_price double precision NOT NULL
);


--
-- Name: orders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.orders (
    id character varying NOT NULL,
    order_number character varying(20) NOT NULL,
    user_id character varying NOT NULL,
    order_type character varying(20) NOT NULL,
    status character varying(20) NOT NULL,
    subtotal double precision NOT NULL,
    delivery_fee double precision NOT NULL,
    commission double precision NOT NULL,
    total double precision NOT NULL,
    delivery_address text,
    delivery_city character varying(50),
    delivery_lat double precision,
    delivery_lng double precision,
    recipient_name character varying(100),
    recipient_phone character varying(20),
    personal_message text,
    is_anonymous boolean NOT NULL,
    is_express boolean NOT NULL,
    scheduled_date timestamp without time zone,
    payment_ref character varying(100),
    payment_status character varying(20) NOT NULL,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL
);


--
-- Name: otps; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.otps (
    id character varying NOT NULL,
    phone character varying(20) NOT NULL,
    code character varying(10) NOT NULL,
    is_used boolean NOT NULL,
    created_at timestamp without time zone NOT NULL,
    expires_at timestamp without time zone NOT NULL
);


--
-- Name: payments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payments (
    id character varying NOT NULL,
    user_id character varying NOT NULL,
    reference character varying(100) NOT NULL,
    order_id character varying,
    booking_id character varying,
    amount double precision NOT NULL,
    currency character varying(5) NOT NULL,
    status character varying(20) NOT NULL,
    provider character varying(20) NOT NULL,
    channel character varying(50),
    metadata_json text,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL
);


--
-- Name: payouts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payouts (
    id character varying NOT NULL,
    provider_id character varying NOT NULL,
    user_id character varying NOT NULL,
    order_id character varying,
    booking_id character varying,
    amount double precision NOT NULL,
    commission double precision NOT NULL,
    status character varying(20) NOT NULL,
    hold_until timestamp without time zone,
    paid_at timestamp without time zone,
    notes text,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL
);


--
-- Name: portfolios; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.portfolios (
    id character varying NOT NULL,
    provider_id character varying NOT NULL,
    image_url character varying(500) NOT NULL,
    caption character varying(500),
    created_at timestamp without time zone NOT NULL
);


--
-- Name: products; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.products (
    id character varying NOT NULL,
    name character varying(200) NOT NULL,
    description text,
    price double precision NOT NULL,
    compare_price double precision,
    category_id character varying NOT NULL,
    vendor_name character varying(200) NOT NULL,
    vendor_id character varying,
    image_url character varying(500),
    images text,
    rating double precision NOT NULL,
    review_count integer NOT NULL,
    order_count integer NOT NULL,
    status character varying(20) NOT NULL,
    is_featured boolean NOT NULL,
    tags text,
    city character varying(50),
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL
);


--
-- Name: providers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.providers (
    id character varying NOT NULL,
    user_id character varying NOT NULL,
    business_name character varying(200) NOT NULL,
    service_type character varying(100) NOT NULL,
    bio text,
    location character varying(200) NOT NULL,
    city character varying(50) NOT NULL,
    lat double precision,
    lng double precision,
    rating double precision NOT NULL,
    review_count integer NOT NULL,
    booking_count integer NOT NULL,
    total_revenue double precision NOT NULL,
    experience_years integer NOT NULL,
    status character varying(20) NOT NULL,
    status_reason text,
    plan character varying(20) NOT NULL,
    is_available boolean NOT NULL,
    offers_home_service boolean NOT NULL,
    offers_salon_service boolean NOT NULL,
    avatar_url character varying(500),
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL
);


--
-- Name: reviews; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reviews (
    id character varying NOT NULL,
    user_id character varying NOT NULL,
    user_name character varying(100) NOT NULL,
    target_type character varying(20) NOT NULL,
    target_id character varying NOT NULL,
    order_id character varying,
    booking_id character varying,
    rating double precision NOT NULL,
    comment text,
    created_at timestamp without time zone NOT NULL
);


--
-- Name: services; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.services (
    id character varying NOT NULL,
    provider_id character varying NOT NULL,
    name character varying(200) NOT NULL,
    description text,
    price double precision NOT NULL,
    duration_minutes integer NOT NULL,
    is_active boolean NOT NULL,
    created_at timestamp without time zone NOT NULL
);


--
-- Name: status_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.status_logs (
    id character varying NOT NULL,
    provider_id character varying NOT NULL,
    changed_by character varying NOT NULL,
    changed_by_name character varying(100) NOT NULL,
    previous_status character varying(20) NOT NULL,
    new_status character varying(20) NOT NULL,
    reason text,
    created_at timestamp without time zone NOT NULL
);


--
-- Name: transactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.transactions (
    id character varying NOT NULL,
    user_id character varying NOT NULL,
    type character varying(10) NOT NULL,
    amount double precision NOT NULL,
    description text,
    reference character varying(100) NOT NULL,
    balance_after double precision NOT NULL,
    status character varying(20) NOT NULL,
    created_at timestamp without time zone NOT NULL
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id character varying NOT NULL,
    full_name character varying(100) NOT NULL,
    email character varying(255),
    phone character varying(20) NOT NULL,
    password_hash character varying(255),
    avatar_url character varying(500),
    city character varying(50),
    address character varying(500),
    lat double precision,
    lng double precision,
    role character varying(20) NOT NULL,
    is_active boolean NOT NULL,
    wallet_balance double precision NOT NULL,
    created_at timestamp without time zone NOT NULL,
    push_token character varying(200),
    updated_at timestamp without time zone NOT NULL
);


--
-- Name: bank_accounts bank_accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bank_accounts
    ADD CONSTRAINT bank_accounts_pkey PRIMARY KEY (id);


--
-- Name: bookings bookings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_pkey PRIMARY KEY (id);


--
-- Name: categories categories_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_name_key UNIQUE (name);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- Name: conversations conversations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_pkey PRIMARY KEY (id);


--
-- Name: deliveries deliveries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.deliveries
    ADD CONSTRAINT deliveries_pkey PRIMARY KEY (id);


--
-- Name: disputes disputes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.disputes
    ADD CONSTRAINT disputes_pkey PRIMARY KEY (id);


--
-- Name: feedback feedback_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.feedback
    ADD CONSTRAINT feedback_pkey PRIMARY KEY (id);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: occasions occasions_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.occasions
    ADD CONSTRAINT occasions_name_key UNIQUE (name);


--
-- Name: occasions occasions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.occasions
    ADD CONSTRAINT occasions_pkey PRIMARY KEY (id);


--
-- Name: order_items order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_pkey PRIMARY KEY (id);


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- Name: otps otps_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.otps
    ADD CONSTRAINT otps_pkey PRIMARY KEY (id);


--
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (id);


--
-- Name: payouts payouts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payouts
    ADD CONSTRAINT payouts_pkey PRIMARY KEY (id);


--
-- Name: portfolios portfolios_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.portfolios
    ADD CONSTRAINT portfolios_pkey PRIMARY KEY (id);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- Name: providers providers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.providers
    ADD CONSTRAINT providers_pkey PRIMARY KEY (id);


--
-- Name: reviews reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_pkey PRIMARY KEY (id);


--
-- Name: services services_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.services
    ADD CONSTRAINT services_pkey PRIMARY KEY (id);


--
-- Name: status_logs status_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.status_logs
    ADD CONSTRAINT status_logs_pkey PRIMARY KEY (id);


--
-- Name: transactions transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_pkey PRIMARY KEY (id);


--
-- Name: reviews uq_review_per_user_target; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT uq_review_per_user_target UNIQUE (user_id, target_type, target_id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: ix_bank_accounts_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_bank_accounts_user_id ON public.bank_accounts USING btree (user_id);


--
-- Name: ix_bookings_booking_number; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX ix_bookings_booking_number ON public.bookings USING btree (booking_number);


--
-- Name: ix_bookings_payment_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_bookings_payment_status ON public.bookings USING btree (payment_status);


--
-- Name: ix_bookings_provider_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_bookings_provider_id ON public.bookings USING btree (provider_id);


--
-- Name: ix_bookings_service_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_bookings_service_id ON public.bookings USING btree (service_id);


--
-- Name: ix_bookings_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_bookings_status ON public.bookings USING btree (status);


--
-- Name: ix_bookings_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_bookings_user_id ON public.bookings USING btree (user_id);


--
-- Name: ix_conversations_buyer_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_conversations_buyer_id ON public.conversations USING btree (buyer_id);


--
-- Name: ix_conversations_provider_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_conversations_provider_id ON public.conversations USING btree (provider_id);


--
-- Name: ix_deliveries_kwik_order_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_deliveries_kwik_order_id ON public.deliveries USING btree (kwik_order_id);


--
-- Name: ix_deliveries_order_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_deliveries_order_id ON public.deliveries USING btree (order_id);


--
-- Name: ix_deliveries_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_deliveries_user_id ON public.deliveries USING btree (user_id);


--
-- Name: ix_disputes_booking_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_disputes_booking_id ON public.disputes USING btree (booking_id);


--
-- Name: ix_disputes_buyer_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_disputes_buyer_id ON public.disputes USING btree (buyer_id);


--
-- Name: ix_disputes_order_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_disputes_order_id ON public.disputes USING btree (order_id);


--
-- Name: ix_disputes_provider_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_disputes_provider_id ON public.disputes USING btree (provider_id);


--
-- Name: ix_disputes_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_disputes_status ON public.disputes USING btree (status);


--
-- Name: ix_feedback_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_feedback_user_id ON public.feedback USING btree (user_id);


--
-- Name: ix_messages_conversation_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_messages_conversation_id ON public.messages USING btree (conversation_id);


--
-- Name: ix_notifications_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_notifications_user_id ON public.notifications USING btree (user_id);


--
-- Name: ix_order_items_order_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_order_items_order_id ON public.order_items USING btree (order_id);


--
-- Name: ix_order_items_product_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_order_items_product_id ON public.order_items USING btree (product_id);


--
-- Name: ix_orders_order_number; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX ix_orders_order_number ON public.orders USING btree (order_number);


--
-- Name: ix_orders_payment_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_orders_payment_status ON public.orders USING btree (payment_status);


--
-- Name: ix_orders_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_orders_status ON public.orders USING btree (status);


--
-- Name: ix_orders_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_orders_user_id ON public.orders USING btree (user_id);


--
-- Name: ix_otps_phone; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_otps_phone ON public.otps USING btree (phone);


--
-- Name: ix_payments_booking_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_payments_booking_id ON public.payments USING btree (booking_id);


--
-- Name: ix_payments_order_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_payments_order_id ON public.payments USING btree (order_id);


--
-- Name: ix_payments_reference; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX ix_payments_reference ON public.payments USING btree (reference);


--
-- Name: ix_payments_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_payments_user_id ON public.payments USING btree (user_id);


--
-- Name: ix_payouts_booking_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_payouts_booking_id ON public.payouts USING btree (booking_id);


--
-- Name: ix_payouts_order_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_payouts_order_id ON public.payouts USING btree (order_id);


--
-- Name: ix_payouts_provider_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_payouts_provider_id ON public.payouts USING btree (provider_id);


--
-- Name: ix_payouts_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_payouts_status ON public.payouts USING btree (status);


--
-- Name: ix_payouts_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_payouts_user_id ON public.payouts USING btree (user_id);


--
-- Name: ix_products_category_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_products_category_id ON public.products USING btree (category_id);


--
-- Name: ix_products_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_products_status ON public.products USING btree (status);


--
-- Name: ix_products_vendor_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_products_vendor_id ON public.products USING btree (vendor_id);


--
-- Name: ix_providers_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_providers_status ON public.providers USING btree (status);


--
-- Name: ix_providers_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_providers_user_id ON public.providers USING btree (user_id);


--
-- Name: ix_reviews_target_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_reviews_target_id ON public.reviews USING btree (target_id);


--
-- Name: ix_reviews_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_reviews_user_id ON public.reviews USING btree (user_id);


--
-- Name: ix_services_provider_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_services_provider_id ON public.services USING btree (provider_id);


--
-- Name: ix_status_logs_provider_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_status_logs_provider_id ON public.status_logs USING btree (provider_id);


--
-- Name: ix_transactions_reference; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX ix_transactions_reference ON public.transactions USING btree (reference);


--
-- Name: ix_transactions_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_transactions_user_id ON public.transactions USING btree (user_id);


--
-- Name: ix_users_phone; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX ix_users_phone ON public.users USING btree (phone);


--
-- Name: bank_accounts bank_accounts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bank_accounts
    ADD CONSTRAINT bank_accounts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: bookings bookings_provider_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_provider_id_fkey FOREIGN KEY (provider_id) REFERENCES public.providers(id);


--
-- Name: bookings bookings_service_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.services(id);


--
-- Name: bookings bookings_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: conversations conversations_buyer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_buyer_id_fkey FOREIGN KEY (buyer_id) REFERENCES public.users(id);


--
-- Name: conversations conversations_provider_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_provider_id_fkey FOREIGN KEY (provider_id) REFERENCES public.users(id);


--
-- Name: deliveries deliveries_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.deliveries
    ADD CONSTRAINT deliveries_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id);


--
-- Name: deliveries deliveries_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.deliveries
    ADD CONSTRAINT deliveries_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: disputes disputes_buyer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.disputes
    ADD CONSTRAINT disputes_buyer_id_fkey FOREIGN KEY (buyer_id) REFERENCES public.users(id);


--
-- Name: messages messages_conversation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversations(id);


--
-- Name: notifications notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: order_items order_items_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id);


--
-- Name: order_items order_items_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id);


--
-- Name: orders orders_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: payouts payouts_provider_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payouts
    ADD CONSTRAINT payouts_provider_id_fkey FOREIGN KEY (provider_id) REFERENCES public.providers(id);


--
-- Name: payouts payouts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payouts
    ADD CONSTRAINT payouts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: portfolios portfolios_provider_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.portfolios
    ADD CONSTRAINT portfolios_provider_id_fkey FOREIGN KEY (provider_id) REFERENCES public.providers(id);


--
-- Name: products products_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id);


--
-- Name: providers providers_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.providers
    ADD CONSTRAINT providers_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: services services_provider_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.services
    ADD CONSTRAINT services_provider_id_fkey FOREIGN KEY (provider_id) REFERENCES public.providers(id);


--
-- Name: status_logs status_logs_changed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.status_logs
    ADD CONSTRAINT status_logs_changed_by_fkey FOREIGN KEY (changed_by) REFERENCES public.users(id);


--
-- Name: status_logs status_logs_provider_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.status_logs
    ADD CONSTRAINT status_logs_provider_id_fkey FOREIGN KEY (provider_id) REFERENCES public.providers(id);


--
-- Name: transactions transactions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- PostgreSQL database dump complete
--

\unrestrict 0uJaSgDsBOfkiKOEugkzmv7DvxMaUkEZHgsUM2M3KzJeXVS6IAMXboV5IKIAiud

