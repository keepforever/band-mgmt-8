# Band Management Application

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

## Attribution

This project was bootstrapped using [The Epic Stack](https://www.epicweb.dev/epic-stack), an opinionated project starter
and reference created by [Kent C. Dodds](https://kentcdodds.com) and
[contributors](https://github.com/epicweb-dev/epic-stack/graphs/contributors).

## Deployment

You'll need to consult the documentation for [The Epic Stack](https://www.epicweb.dev/epic-stack) to learn how to deploy
this application. It's pretty complex and that's one of the reasons why starting with the boilerplate is so helpful.
