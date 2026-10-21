# VetSight AI: API contract (frontend ⇄ FastAPI)

Base URL: `VITE_API_BASE_URL` (example `https://host/api/v1`). JSON, `camelCase`, dates in ISO-8601 UTC, ids as strings (`_id`).
Auth: `Authorization: Bearer <JWT>`. A `401` makes the app log the user out.
The UI is written against these shapes. Field names follow the MongoDB collections in `VetSight_AI_MongoDB_Schema_v2.md`.

## Errors

Return FastAPI `HTTPException` with either a string or an object (preferred, so the UI can show a translated message):

```json
{ "detail": { "code": "invalid_credentials", "message": "Incorrect email or password." } }
```

Codes the UI translates: `invalid_credentials`, `account_pending`, `account_blocked`, `account_rejected`, `email_exists`, `otp_invalid`, `otp_expired`, `slot_unavailable`, `out_of_stock`, `prescription_required`, `animal_exists`, `category_in_use`, `farm_address_required`, `not_found`, `invalid_input`.
Any other error shows `detail` text (or a generic message).

## Shared values

- **Districts**: `region` is one of the ids in `src/data/punjab.js` (e.g. `Lahore`, `Chiniot`, `RahimYarKhan`, `DGKhan`, `MandiBahauddin`, `NankanaSahib`, `TobaTekSingh`). Use those exact ids in `users.location.region`, `farms.region`, `riskPredictions.region`.
- **Farm species**: `cattle`, `buffalo`, `mixed`. **Breeds** (`animals.breed`): `Sahiwal`, `Tharparkar` (cattle), `Nili-Ravi`, `Kundi` (buffalo). **Gender**: `female`, `male`.
- **Diseases**: `LSD`, `FMD`, `Pinkeye`, `Ringworm`, `Mange`, `Healthy`.
- **Risk levels**: `Low`, `Medium`, `High`. **Climate** is a text label such as `Hot and humid`, `Hot and dry`, `Monsoon rains`, `Mild and dry`, `Cool and humid`.
- **Roles**: `farmer`, `vet`, `store`, `admin`. **User status**: `active`, `pending`, `blocked`, `rejected`.
- **Appointment type**: `farm-visit`, `in-person`. **Appointment status**: `requested`, `confirmed`, `rescheduled`, `completed`, `cancelled`.
- **Order status** (`deliveryStatus`): `ordered`, `accepted`, `processing`, `out-for-delivery`, `delivered`, `rejected`. **Payment**: always `cod` (cash on delivery).
- **Health record status**: `active`, `healthy`, `recovered`, `referred`.

## Auth and profile

| Call | Body | Response |
|---|---|---|
| `POST /auth/register` | `{role, firstName, lastName, email, phone?, region, password}` | `{email, expiresInSeconds: 300}` (send OTP by email; store the pending signup) |
| `POST /auth/verify-otp` | `{email, otp}` | `{token, user}` for farmers. `{pendingApproval: true}` for vet/store (status `pending`) |
| `POST /auth/resend-otp` | `{email}` | `{email, expiresInSeconds}` |
| `POST /auth/login` | `{email, password}` | `{token, user}`. Errors `invalid_credentials`, `account_pending`, `account_blocked`, `account_rejected` |
| `GET /auth/me` | none | `user` |
| `PATCH /users/me` | `{name, phone, region, specialty?, clinicAddress?, address?}` | `user` |
| `PUT /users/me/availability` (vet) | `{availableSlots: [ISO date, …]}` | `user` |

`user` = `{_id, role, name, email, phone, status, createdAt, location:{type:'Point', coordinates:[lng,lat], region}, …role fields}`; never return `passwordHash`.
Vet fields: `specialty`, `clinicAddress`, `availableSlots`. Store: `address`.

## Farms (farmer; a farmer can have many)

| Call | Body | Response |
|---|---|---|
| `GET /farms` | none | `[ {_id, ownerId, species, cattleCount, region, address, createdAt} ]` (own farms) |
| `POST /farms` / `PUT /farms/{id}` | `{species, cattleCount, region, address}`; `address` required, at least 5 characters | farm |
| `DELETE /farms/{id}` | none | `{ok:true}` |

`cattleCount` is the herd size. Animals are registered separately (below), so the count of animal profiles can be lower.

## Animals (registered inside a farm)

| Call | Body | Response |
|---|---|---|
| `GET /animals?farmId=` | none | `[ {_id, farmId, ownerId, animalTag, breed, ageYears, gender, weightKg, photoUrl, createdAt} ]` (own animals) |
| `POST /animals` / `PUT /animals/{id}` (multipart) | `farmId`, `animalTag`, `breed`, `ageYears` (0 to 30), `gender`, `weightKg?`, `photo?` (PNG/JPG ≤ 10 MB), `removePhoto?` | animal. `animalTag` must be unique within the farm, case-insensitive (else `animal_exists`) |
| `DELETE /animals/{id}` | none | `{ok:true}` |

## Detection and health records

| Call | Body | Response |
|---|---|---|
| `POST /detections` (multipart) | `farmId`, `animalId`, `image` (PNG/JPG, ≤ 10 MB) | **Recognised:** saved health record `{_id, farmId, animalId, diagnosis:{disease, confidenceScore, imageUrl, modelVersion}, treatmentInfo, status, referredToDoctor, createdAt}`. **Low confidence / out of scope:** `{outOfScope:true, reason:'low_confidence'|'out_of_scope'}` (HTTP 200, nothing saved) |
| `GET /health-records?farmId=&animalId=` | none | Farmer: records of own farms. **Vet:** only with `animalId`, and only for animals linked to one of the vet's appointments. Newest first |
| `GET /diseases` | none | `[ {id, kind:'disease'|'healthy', name:{en,ur}, description:{en,ur}, symptoms:{en:[],ur:[]}, prevention:{en:[],ur:[]}, treatment:{en,ur}, medicineKeywords:[]} ]` |

## Chatbot

`POST /chat/message` body `{sessionId?, text, language:'en'|'ur', inputType:'text'|'voice', action?, diseaseId?}`
- text message → `{sessionId?, kind:'answer', text, diseaseId, prevention:[…], actions:['medicines','vets']}` or `{kind:'clarify', text, actions:['vets']}`
- `action:'medicines'` + `diseaseId` → `{kind:'medicines', text, medicines:['Product name', …]}`. **Names only**: no prices, stores or notices. Only active products of active stores
- `action:'vets'` → `{kind:'vets', text, vets:[vet]}`

The reply `text` must already be in the requested `language`, phrased as *possible* information (never a confirmed diagnosis, no dosage).

## Risk (scheduled job)

Predictions are produced by a **scheduled backend job** and stored. The app only reads them.

`GET /risk-predictions?region=&disease=` → `[ {_id, region, location, disease, riskLevel, probability (0 to 1), climate, modelVersion, isStale, source:'live'|'cached', predictedAt} ]`.
- The map requests all districts at once (36 × 5 diseases) and refreshes every 5 minutes or on the Refresh button.
- `isStale: true` (for example the weather service was unavailable) makes the UI show "Using last known data".
- **Alerts:** when a prediction is `Medium` or `High` for a region, the job creates a `riskAlert` notification for each farmer with a farm in that region (use `farms.region`). Avoid repeating the same alert while the level is unchanged.

## Vets and appointments

| Call | Body | Response |
|---|---|---|
| `GET /vets?region=` | none | active vets sorted by distance from `region`: `{_id, name, specialty, clinicAddress, phone, location, availableSlots:[future ISO dates], distanceKm}` |
| `GET /appointments` | none | role-aware: farmer sees own, vet sees theirs. Each includes populated `farmerName`, `doctorName`, `clinicAddress`, `farmRegion`, `farmAddress`, `farmSpecies`, `cattleCount`, `animalId`, `animal` (`{animalTag, breed, ageYears, gender, weightKg, photoUrl}` or null), `diagnosis` (from `healthRecordId`), `hasPrescription`, plus `cancelReason`, `cancelledBy` (`farmer`\|`vet`) |
| `POST /appointments` | `{doctorId, farmId, animalId?, healthRecordId?, appointmentType, scheduledAt}` | appointment. Slot must be in the vet's `availableSlots` (else `slot_unavailable`) and is removed from it. For `farm-visit` the farm must have an address (else `farm_address_required`). If only `healthRecordId` is sent, take `animalId` from the record. Notify the vet |
| `PATCH /appointments/{id}/status` | `{action, scheduledAt?, notes?, reason?}` | appointment. See actions below |
| `POST /appointments/{id}/prescription` (vet) | `{medicine:[{name, dosage, duration}], notes}` | prescription. Notify the farmer |
| `GET /prescriptions` | none | `[ {_id, appointmentId, farmId, medicine, notes, createdAt, doctorName} ]` |

**Actions:** `confirm` (vet), `reschedule` (vet, needs `scheduledAt`; status becomes `rescheduled` until the farmer accepts), `accept-reschedule` (farmer), `cancel` (vet or farmer, optional `reason`; frees the slot; notify the other party), `complete` (vet, optional `notes`).

## Marketplace and orders

Categories are managed by admin. Product = `{productId, storeId, storeName, storeRegion, medicineName, categoryId, category, categoryUr, description, price, stock, requiresPrescription, isActive}` (`category` and `categoryUr` are populated from `productCategories`).

| Call | Body | Response |
|---|---|---|
| `GET /categories` | none | `[ {_id, name, nameUr} ]` |
| `GET /products` | none | **active** products of active stores |
| `POST /orders` | `{storeId, items:[{productId, medicineName, quantity}], deliveryAddress, paymentMethod:'cod', prescriptionId?}` | order `{_id, userId, storeId, prescriptionId, items:[{productId, medicineName, quantity, price}], totalAmount, paymentMethod:'cod', deliveryAddress, deliveryStatus:'ordered', orderedAt, storeName, farmerName}`. Errors `out_of_stock`, `prescription_required`. Notify the store |
| `GET /orders` | none | farmer sees own, store sees theirs (with `storeName`, `farmerName`, `rejectReason?`) |
| `PATCH /orders/{id}/status` | `{action, reason?}`, `action` ∈ `accept`, `reject`, `processing`, `out-for-delivery`, `delivered` | order. `accept` reduces stock. Notify the farmer |

## Notifications and feedback

- `GET /notifications` → `[ {_id, userId, type, message, isRead, createdAt} ]`. Types: `riskAlert`, `appointmentUpdate`, `prescription`, `orderUpdate`, `newRequest`, `newOrder`.
- `PATCH /notifications/{id}/read`, `PATCH /notifications/read-all`.
- `POST /feedback` `{rating:1-5, message}`.

## Admin (role `admin` only)

| Call | Notes |
|---|---|
| `GET /admin/stats` | `{users:{farmer,vet,store,admin}, pendingApprovals, farms, animals, detections, orders, appointments, diseaseDistribution:{LSD:n,…}, riskCounts:{Low,Medium,High}}` |
| `GET /admin/users` | all users (no password fields) |
| `PATCH /admin/users/{id}/status` | `{status}`. Approving a pending vet/store sets `active`. Stores use `blocked` for "suspended" |
| `DELETE /admin/users/{id}` | |
| `GET /admin/products` | all products including `isActive:false` |
| `POST /admin/products`, `PUT /admin/products/{productId}`, `DELETE /admin/products/{productId}` | `{storeId, medicineName, categoryId, description, price, stock, requiresPrescription, isActive}` |
| `POST /admin/categories`, `PUT /admin/categories/{id}`, `DELETE /admin/categories/{id}` | `{name, nameUr}`. Delete fails with `category_in_use` while products use it |
| `PUT /admin/diseases/{id}` | full disease object (see `/diseases`) |
| `GET /admin/feedback`, `PATCH /admin/feedback/{id}` | `{status:'new'|'resolved'}`. Items `{_id, userName, rating, message, status, createdAt}` |

Passwords must be hashed server-side (bcrypt/argon2); OTP expiry is 5 minutes.
