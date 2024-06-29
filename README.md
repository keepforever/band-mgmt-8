# Band Management Application TL;DR

The Band Management Application is intended to help cover bands organize and manage common information. It allows band
members to manage songs, set lists, events, venues and associated contacts.

## Features

- **Songs Management**: Organize and manage your band's repertoire, upload lyrics.
- **Set Lists**: Create and manage set lists for different events.
- **Event Venues**: Keep track of the venues you play at and store contact information.
- **Availability Calendar**: Band members can input their availability, making it easier to schedule events.
- **Technicians**: Info about common technicians and their contact information.

## Getting Started

#### Install the dependencies

```sh
npm install
```

#### Create a `.env` file in the root of the project and add the environment variables based on the `.env.example` file.

```sh
# You can just copy the contents of the `.env.example` file and paste it into the newly created `.env` file.
```

#### Run setup script to create the database and seed it with initial data

```sh
npm run setup
```

#### Start the development server

```sh
npm run dev
```

#### Open your browser and go to `http://localhost:3000` to see the application running.

## Current Seeded User Credentials to login

- **Username**: `kody` | **Password**: `tacobell`

## Wiping Data and Starting Fresh

If you want to wipe the data and start fresh, you can run the following command:

```sh
npx prisma migrate reset
```

## If you want to nuke the database and start fresh in UAT or Production

```sh
# ssh into the fly app console
fly ssh console -a <fly-app-name>
# once you're in the console
npx prisma migrate reset --force --skip-seed
```

## Attribution

This project was bootstrapped using [The Epic Stack](https://www.epicweb.dev/epic-stack), an opinionated project starter
and reference created by [Kent C. Dodds](https://kentcdodds.com) and
[contributors](https://github.com/epicweb-dev/epic-stack/graphs/contributors).

## Deployment

You'll need to consult the documentation for [The Epic Stack](https://www.epicweb.dev/epic-stack) to learn how to deploy
this application. It's pretty complex and that's one of the reasons why starting with the boilerplate is so helpful.

# Longer Explanation

## Overview

This application is designed to streamline band management tasks, such as booking shows, tracking venues, creating set
lists, and managing song information. It facilitates efficient coordination among band members and ensures seamless
event planning.

## Features

### User Management

- **User Signup/Login:** Users can create accounts and log in to the application.
- **Profile Management:** Users can upload profile pictures and manage their profile information.

### Band Management

- **Band Creation:** Users can create a band and invite other users to join.
- **Role Assignment:** Assign roles to band members (e.g., lead vocals, lead guitar).

### Song Management

- **Individual Song Upload:** Add songs individually with relevant details.
- **Bulk Song Upload:** Upload multiple songs at once via CSV file.
- **Lyrics Upload:** Upload and display song lyrics in PDF or Word format.

### Venue Management

- **Venue Creation:** Add venues with details such as location, capacity, and contact information.
- **Contact Management:** Add and manage contacts for each venue.

### Event Management

- **Event Creation:** Create events with details like venue, start and end times, payment, and notes.
- **Technician Management:** Add and associate sound or lighting technicians with events.
- **Event Calendar:** View and manage events in a calendar view.

### Set List Management

- **Set List Creation:** Create set lists and associate them with events.
- **Song Management:** Drag and drop songs into set lists, and search for songs easily.
- **Set List Cloning:** Clone existing set lists for reuse in different events.

### Availability Management

- **Blackout Dates:** Band members can set their availability and blackout dates.
- **Availability Calendar:** View band availability and manage booking schedules.

### Quality of Life Features

- **YouTube Integration:** Quick links to YouTube searches for songs.
- **Google Maps Integration:** Quick links to venue locations on Google Maps.

This application aims to provide comprehensive tools for band management, enhancing coordination and efficiency in
planning and executing events.
