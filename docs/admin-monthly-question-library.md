# Admin Dashboard — Monthly Question Library TODO

Future phase: build the Admin Monthly Question Library as the source of truth for Monthly Question content.

Scope notes:

- Admins create, edit, save drafts, publish, archive, duplicate, and delete source Monthly Questions with safeguards.
- Coaches select published questions from the library and assign them to authorized Circles.
- Coach assignment actions must not alter the source bank question.
- Circle assignment state belongs in `monthly_question_circle_assignments`.
- Existing coach-created test questions should be reviewed by an admin before being treated as reusable published library content.
- Future fields may include category, theme, source attribution, availability status, and richer assignment reporting.
