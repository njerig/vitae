--
-- PostgreSQL database dump
--

\restrict pMhx7jwaWaspf63xGbhMNYgemg0HI3TLE1IIeKqYp0cpiBXr0x2BLm87ODCJ4vx

-- Dumped from database version 16.11 (Debian 16.11-1.pgdg13+1)
-- Dumped by pg_dump version 16.11 (Debian 16.11-1.pgdg13+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: experience_bullets; Type: TABLE; Schema: public; Owner: vitae
--

CREATE TABLE public.experience_bullets (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    experience_id uuid NOT NULL,
    bullet_text text NOT NULL,
    "position" integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.experience_bullets OWNER TO vitae;

--
-- Name: experiences; Type: TABLE; Schema: public; Owner: vitae
--

CREATE TABLE public.experiences (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    title text NOT NULL,
    org text NOT NULL,
    org_location text,
    start_date date,
    end_date date,
    is_current boolean DEFAULT false NOT NULL,
    summary text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.experiences OWNER TO vitae;

--
-- Name: oauth_accounts; Type: TABLE; Schema: public; Owner: vitae
--

CREATE TABLE public.oauth_accounts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    provider text NOT NULL,
    provider_user_id text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.oauth_accounts OWNER TO vitae;

--
-- Name: users; Type: TABLE; Schema: public; Owner: vitae
--

CREATE TABLE public.users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email text NOT NULL,
    full_name text,
    phone_number text,
    location text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.users OWNER TO vitae;

--
-- Data for Name: experience_bullets; Type: TABLE DATA; Schema: public; Owner: vitae
--

COPY public.experience_bullets (id, experience_id, bullet_text, "position", created_at, updated_at) FROM stdin;
68d8b760-edf8-4be1-8497-87950efa340c	84334d12-dcb0-4649-a64a-e540bf729c4e	Automated build + release workflows to reduce manual steps.	0	2026-01-23 22:24:44.293501+00	2026-01-23 22:24:44.293501+00
4e1fa347-cc00-452a-b2a3-b8ae1567231c	84334d12-dcb0-4649-a64a-e540bf729c4e	Improved reliability of deployment pipelines with validation checks.	1	2026-01-23 22:24:44.293501+00	2026-01-23 22:24:44.293501+00
e79968a7-2fa0-483d-87c9-6783c20a3915	1bde15a8-b667-4753-901e-22705c267444	Designed schema + initdb workflow for local dev.	0	2026-01-23 22:32:31.992154+00	2026-01-23 22:32:31.992154+00
c7afcf92-3987-4b30-8315-ae551715f2f6	1bde15a8-b667-4753-901e-22705c267444	Tested DB + set up data migration + documentation	1	2026-01-23 22:32:31.992154+00	2026-01-23 22:32:31.992154+00
\.


--
-- Data for Name: experiences; Type: TABLE DATA; Schema: public; Owner: vitae
--

COPY public.experiences (id, user_id, title, org, org_location, start_date, end_date, is_current, summary, created_at, updated_at) FROM stdin;
84334d12-dcb0-4649-a64a-e540bf729c4e	8a2e1ef9-a726-4d79-a9c6-695a97e6aef0	Software Engineer	Example Corp	Palo Alto, CA	2024-06-01	\N	t	Built internal tools to speed up release automation.	2026-01-23 22:24:44.293501+00	2026-01-23 22:24:44.293501+00
1bde15a8-b667-4753-901e-22705c267444	1ba68e0a-f68e-4a53-b89f-b5eb3ee6ba78	Backend Engineer	Vitae	Santa Cruz, CA	2026-01-05	\N	t	\N	2026-01-23 22:29:57.047996+00	2026-01-23 22:29:57.047996+00
\.


--
-- Data for Name: oauth_accounts; Type: TABLE DATA; Schema: public; Owner: vitae
--

COPY public.oauth_accounts (id, user_id, provider, provider_user_id, created_at) FROM stdin;
50d31109-0113-4ca6-9e50-5fae660175c4	8a2e1ef9-a726-4d79-a9c6-695a97e6aef0	google	demo-google-sub	2026-01-23 22:24:44.2929+00
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: vitae
--

COPY public.users (id, email, full_name, phone_number, location, created_at, updated_at) FROM stdin;
8a2e1ef9-a726-4d79-a9c6-695a97e6aef0	demo@vitae.local	Demo User	+1 (555) 010-0000	Santa Clara, CA	2026-01-23 22:24:44.292272+00	2026-01-23 22:24:44.292272+00
1ba68e0a-f68e-4a53-b89f-b5eb3ee6ba78	alio@ucsc.edu	Alexander Lio	+1 650 946 6688	Los Altos, CA	2026-01-23 22:28:36.30031+00	2026-01-23 22:28:36.30031+00
\.


--
-- Name: experience_bullets experience_bullets_pkey; Type: CONSTRAINT; Schema: public; Owner: vitae
--

ALTER TABLE ONLY public.experience_bullets
    ADD CONSTRAINT experience_bullets_pkey PRIMARY KEY (id);


--
-- Name: experiences experiences_pkey; Type: CONSTRAINT; Schema: public; Owner: vitae
--

ALTER TABLE ONLY public.experiences
    ADD CONSTRAINT experiences_pkey PRIMARY KEY (id);


--
-- Name: oauth_accounts oauth_accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: vitae
--

ALTER TABLE ONLY public.oauth_accounts
    ADD CONSTRAINT oauth_accounts_pkey PRIMARY KEY (id);


--
-- Name: oauth_accounts oauth_accounts_provider_provider_user_id_key; Type: CONSTRAINT; Schema: public; Owner: vitae
--

ALTER TABLE ONLY public.oauth_accounts
    ADD CONSTRAINT oauth_accounts_provider_provider_user_id_key UNIQUE (provider, provider_user_id);


--
-- Name: oauth_accounts oauth_accounts_user_id_provider_key; Type: CONSTRAINT; Schema: public; Owner: vitae
--

ALTER TABLE ONLY public.oauth_accounts
    ADD CONSTRAINT oauth_accounts_user_id_provider_key UNIQUE (user_id, provider);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: vitae
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: vitae
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: experience_bullets_exp_idx; Type: INDEX; Schema: public; Owner: vitae
--

CREATE INDEX experience_bullets_exp_idx ON public.experience_bullets USING btree (experience_id);


--
-- Name: experiences_user_id_idx; Type: INDEX; Schema: public; Owner: vitae
--

CREATE INDEX experiences_user_id_idx ON public.experiences USING btree (user_id);


--
-- Name: experience_bullets experience_bullets_experience_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: vitae
--

ALTER TABLE ONLY public.experience_bullets
    ADD CONSTRAINT experience_bullets_experience_id_fkey FOREIGN KEY (experience_id) REFERENCES public.experiences(id) ON DELETE CASCADE;


--
-- Name: experiences experiences_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: vitae
--

ALTER TABLE ONLY public.experiences
    ADD CONSTRAINT experiences_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: oauth_accounts oauth_accounts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: vitae
--

ALTER TABLE ONLY public.oauth_accounts
    ADD CONSTRAINT oauth_accounts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict pMhx7jwaWaspf63xGbhMNYgemg0HI3TLE1IIeKqYp0cpiBXr0x2BLm87ODCJ4vx

