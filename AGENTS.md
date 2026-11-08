<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Campus data, NLP, risk and recommendation logic live in src/lib/campus.ts; app state/demo auth in src/lib/store.tsx (client-side localStorage) — keeps the demo fast with no backend.
- Subject submissions extend the existing campus feedback store with faculty/year metadata; Admin and assigned-faculty views use a student-identifier-free projection so legacy NLP and feedback records remain compatible.
- Demo account views use transient sample state, never create an auth token or grant Cloud privileges, and never write ordinary saved campus records; real sign-in remains Cloud-authenticated.
- Keep the campus React context in its own non-component module with a development-only stable identity registry so hot updates cannot mismatch providers; never store account state in that registry.
- Student leave state is shared through the campus provider; faculty decision notifications read existing Cloud leave rows and account-scoped read markers, while demo leaves stay transient across demo role switches so decisions can be demonstrated without saved-record writes.
- Attendance reports derive only from submitted date/subject/year marks, not unsaved edits, so report totals and exported rows reflect the saved sheet.
- Daily attendance is persisted per student/date/subject/year in Cloud with assigned-faculty write and student-own read policies; the shared provider refreshes every five seconds and on focus for cross-device calendar delivery, while demos remain transient across role switches.
- Student calendars default to their most recent submitted subject as records arrive; an explicit subject selection remains unchanged during refreshes so marks stay subject-specific.
- Campus ID sign-in exchanges passwords server-side with a private service-only lookup and persisted attempt limits; signup retains verification email and IDs never determine roles.
- Only server-validated Admins grant Faculty role and subject assignments; faculty leave submissions and Admin decisions use Cloud RLS, while student records remain the existing browser-based sample store until migrated.
