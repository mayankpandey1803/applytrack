# Project walkthrough (Hinglish)

## Pehle khud run karo
Node.js 24 install karo. Repository ZIP download/extract karo. ApplyTrack ke liye root folder mein `npm start`; StockDesk ke liye `stockdesk` folder mein `npm start`. Browser mein http://127.0.0.1:3000 kholo. Ek time par ek app chalao. Stop: Ctrl+C. Tests: `npm test`.

## ApplyTrack ko samjho
Problem: alag companies ki job applications aur unka hiring stage track karna.
Flow: form submit -> frontend fetch() -> Node.js route -> validation -> SQLite INSERT -> UI refresh.
GET data padhta hai, POST naya record banata hai, PATCH status badalta hai, DELETE record hatata hai.
Prepared query mein SQL structure aur user input alag rehte hain; isse input SQL command nahi ban jata.
Demo: company aur role add karo, Interview select karo, search/filter karo, CSV export karo.

## StockDesk ko samjho
Problem: kitna stock hai aur quantity kyun badli, dono record karna.
products table current balance rakhti hai; movements table har change ka reason aur timestamp.
Transaction ek group of operations hai jo poora succeed ya poora rollback hota hai.
10 units receive, 4 issue -> balance 6. Ab 7 issue karoge to 409 error; balance 6 hi rahega aur failed change history mein nahi aayega.
SKU product ka unique identifier hai. Duplicate SKU reject hota hai.

## Interview mein common questions
- SQLite kyun? Local demo ke liye simple setup aur persistent relational data; separate DB server nahi chahiye.
- Node.js kya karta hai? HTTP requests handle karta hai, validation aur database operations chalata hai, JSON response deta hai.
- Frontend aur backend validation? Frontend user experience improve karta hai; backend invalid API input ko independently reject karta hai.
- Limitations? Authentication, user permissions aur pagination abhi nahi hain. Public production service claim mat karo.
- Next improvement? Login/user isolation, pagination, clearer loading states aur browser-based tests.
- AI use? Haan, implementation mein AI assistance li gayi. Sirf wahi personal review/modifications claim karo jo tumne sach mein kiye hain.

## Before sending applications
Code ka ek flow padhkar run karo. Apne shabdon mein explain karo. Koi line samajh nahi aaye to usko guess karke explain mat karo. Fake users, speed gains, deployment dates ya independent authorship claim mat karo.
