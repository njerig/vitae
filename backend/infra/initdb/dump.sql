--
-- PostgreSQL database dump
--

\restrict ApjdX1HFNioU6a3t0iwTomMDN8bnjugdkVPa31xPJMoViZgQR7r4VUf8xUcXoSl

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
-- Name: canon_items; Type: TABLE; Schema: public; Owner: vitae
--

CREATE TABLE public.canon_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id text NOT NULL,
    item_type text NOT NULL,
    title text DEFAULT ''::text NOT NULL,
    "position" integer DEFAULT 0 NOT NULL,
    content jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT canon_items_item_type_check CHECK ((item_type = ANY (ARRAY['education'::text, 'work'::text, 'project'::text, 'skill'::text, 'link'::text])))
);


ALTER TABLE public.canon_items OWNER TO vitae;

--
-- Name: users; Type: TABLE; Schema: public; Owner: vitae
--

CREATE TABLE public.users (
    id text NOT NULL,
    email text,
    full_name text,
    phone_number text,
    location text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.users OWNER TO vitae;

--
-- Name: versions; Type: TABLE; Schema: public; Owner: vitae
--

CREATE TABLE public.versions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id text NOT NULL,
    name text NOT NULL,
    snapshot jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.versions OWNER TO vitae;

--
-- Name: working_state; Type: TABLE; Schema: public; Owner: vitae
--

CREATE TABLE public.working_state (
    user_id text NOT NULL,
    state jsonb DEFAULT '{}'::jsonb NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.working_state OWNER TO vitae;

--
-- Data for Name: canon_items; Type: TABLE DATA; Schema: public; Owner: vitae
--

COPY public.canon_items (id, user_id, item_type, title, "position", content, created_at, updated_at) FROM stdin;
b0dfc775-3454-403b-8d73-36aba02df237	user_abc123	work	Broadcom	0	{"end": null, "org": "Broadcom", "role": "Software Engineer Intern", "start": "2024-06", "bullets": ["Automated release workflows and reduced manual steps.", "Improved pipeline reliability with validation checks."], "location": "Palo Alto, CA", "is_current": true}	2026-01-27 06:48:17.377977+00	2026-01-27 06:48:17.377977+00
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: vitae
--

COPY public.users (id, email, full_name, phone_number, location, created_at, updated_at) FROM stdin;
9b3839d3-5ff9-4e79-8edd-5e2f0a36ab41	demo@vitae.local	Demo User	+1 (555) 010-0000	Santa Clara, CA	2026-01-27 06:47:17.256999+00	2026-01-27 06:47:17.256999+00
user_abc123	alex@example.com	Alex Lio	+1 555 222 3333	Santa Clara, CA	2026-01-27 06:48:02.045492+00	2026-01-27 06:48:02.045492+00
\.


--
-- Data for Name: versions; Type: TABLE DATA; Schema: public; Owner: vitae
--

COPY public.versions (id, user_id, name, snapshot, created_at) FROM stdin;
\.


--
-- Data for Name: working_state; Type: TABLE DATA; Schema: public; Owner: vitae
--

COPY public.working_state (user_id, state, updated_at) FROM stdin;
\.


--
-- Name: canon_items canon_items_pkey; Type: CONSTRAINT; Schema: public; Owner: vitae
--

ALTER TABLE ONLY public.canon_items
    ADD CONSTRAINT canon_items_pkey PRIMARY KEY (id);


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
-- Name: versions versions_pkey; Type: CONSTRAINT; Schema: public; Owner: vitae
--

ALTER TABLE ONLY public.versions
    ADD CONSTRAINT versions_pkey PRIMARY KEY (id);


--
-- Name: working_state working_state_pkey; Type: CONSTRAINT; Schema: public; Owner: vitae
--

ALTER TABLE ONLY public.working_state
    ADD CONSTRAINT working_state_pkey PRIMARY KEY (user_id);


--
-- Name: canon_items_user_idx; Type: INDEX; Schema: public; Owner: vitae
--

CREATE INDEX canon_items_user_idx ON public.canon_items USING btree (user_id);


--
-- Name: canon_items_user_type_idx; Type: INDEX; Schema: public; Owner: vitae
--

CREATE INDEX canon_items_user_type_idx ON public.canon_items USING btree (user_id, item_type);


--
-- Name: versions_user_created_idx; Type: INDEX; Schema: public; Owner: vitae
--

CREATE INDEX versions_user_created_idx ON public.versions USING btree (user_id, created_at DESC);


--
-- Name: versions_user_idx; Type: INDEX; Schema: public; Owner: vitae
--

CREATE INDEX versions_user_idx ON public.versions USING btree (user_id);


--
-- Name: canon_items canon_items_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: vitae
--

ALTER TABLE ONLY public.canon_items
    ADD CONSTRAINT canon_items_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: versions versions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: vitae
--

ALTER TABLE ONLY public.versions
    ADD CONSTRAINT versions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: working_state working_state_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: vitae
--

ALTER TABLE ONLY public.working_state
    ADD CONSTRAINT working_state_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict ApjdX1HFNioU6a3t0iwTomMDN8bnjugdkVPa31xPJMoViZgQR7r4VUf8xUcXoSl

