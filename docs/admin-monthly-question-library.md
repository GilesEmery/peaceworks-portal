# Admin Monthly Question Library — future enhancements

The Admin Monthly Question Library is the source of truth for reusable Monthly
Question content. The current implementation supports authoring, publishing,
archiving, duplication, and canonical assignment. The following notes describe
possible future refinements rather than missing foundational behavior.

Scope notes:

- Admins create, edit, save drafts, publish, archive, duplicate, and delete source Monthly Questions with safeguards.
- Coaches select published questions from the library and assign them to authorized Circles.
- Coach assignment actions must not alter the source bank question.
- Circle assignment state belongs in `monthly_question_circle_assignments`.
- Existing coach-created test questions should be reviewed by an admin before being treated as reusable published library content.
- Future fields may include category, theme, source attribution, availability status, and richer assignment reporting.
