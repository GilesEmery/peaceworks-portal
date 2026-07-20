# Admin Training Library / Course Builder — future enhancements

The current Training Library supports reusable training records and canonical
assignment. A full course builder remains future work.

Initial scope notes:

- Keep Trainings separate from Resources.
- Support courses, modules, lessons, videos, guided reflections, downloadable materials, and progress-based learning.
- Allow admins to create, edit, archive, publish, and assign trainings to Circles or members.
- Track completion and progress independently from general resource access.
- Consider prerequisites, sequencing, reminders, and reflection prompts after the first version is stable.
- Keep all assignment and progress writes behind secure server-side APIs.
- Do not expose service-role credentials or privileged training-management operations to browser code.

The Coach Dashboard Trainings workspace can evolve alongside the future course
builder without changing the current library contract.
