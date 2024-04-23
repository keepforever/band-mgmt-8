To allow a setlist to be associated with multiple events while ensuring that each event can only have one setlist, you
need to adjust the way setlists and events are linked in your schema. Since you want each event to have only one setlist
but a setlist can be used by multiple events, the relationship can be simplified as follows:

### Adjustments to the Schema:

1. **Modify the `Setlist` model:** Remove the `eventId` field and the unique constraint, as these are no longer
   necessary because we are no longer directly linking each setlist to only one event.

2. **Update the `Event` model:** Add a `setlistId` field to the `Event` model to establish a many-to-one relationship
   (many events can reference one setlist).

Here's how you can refactor your Prisma schema:

#### Setlist Model

Remove the `eventId` and its associated relationship to make the `Setlist` model independent, allowing it to be
associated with multiple events.

```prisma
model Setlist {
  id          String  @id @default(cuid())
  name        String
  sets        Set[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  BandSetlist BandSetlist[]
  events      Event[]
}
```

#### Event Model

Add a `setlistId` field with a nullable relation to `Setlist`. This modification ensures that each event can be linked
to one setlist, but a setlist can be used across multiple events.

```prisma
model Event {
  id        String    @id @default(cuid())
  name      String
  date      DateTime
  location  String
  bands     BandEvent[]
  venueId   String?
  venue     Venue?    @relation(fields: [venueId], references: [id], onDelete: Cascade)
  setlistId String?
  setlist   Setlist?  @relation(fields: [setlistId], references: [id], onDelete: SetNull)

  @@index([id])
}
```

In this setup:

- The `Setlist` model can be linked to multiple `Event` records through the `setlistId` field in the `Event` model.
- Each `Event` maintains a reference to exactly one `Setlist`, fulfilling the requirement that an event can only have
  one setlist, but a setlist can be associated with multiple events.

These changes should align the schema with your requirement that a setlist can be reused across different events without
altering the constraint that each event should only have one setlist.
