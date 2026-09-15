# Scorecard proof of concept

This folder is a browser-only proof of concept for the 2030 Plan Scorecard, Annual Scorecard, and Weekly Accountability surfaces. Vite serves it at `/scorecard-demo/`.

The sample records, position switcher, scoring ledger, and submissions use browser storage. They demonstrate interaction and visual direction; they are not a production identity, authorization, scoring, or database implementation.

Keep production work in the React application and Supabase migrations. When a proof-of-concept surface is accepted, port it as a tested vertical slice rather than extending this folder into a second application.
