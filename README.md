### Performance Rating

Performance Rating

### Installation

You can install this app using the [bench](https://github.com/frappe/bench) CLI:

```bash
cd $PATH_TO_YOUR_BENCH
bench get-app $URL_OF_THIS_REPO --branch develop
bench install-app performance_rating
```

### Contributing

This app uses `pre-commit` for code formatting and linting. Please [install pre-commit](https://pre-commit.com/#installation) and enable it for this repository:

```bash
cd apps/performance_rating
pre-commit install
```

Pre-commit is configured to use the following tools for checking and formatting your code:

- ruff
- eslint
- prettier
- pyupgrade

### Documentation: How to Make a Rating Entry

This section explains the setup and flow for rating a document and how the fields relate to each other.

#### Flow Overview

1. Create rating parameters.
2. Create a rating setup that uses those parameters.
3. Create the business document (PO/SO/GRN/DN/SI/PI, etc).
4. Update ratings from the business document and review the auto-created `Rating Log`.

#### Step-by-Step

1. Create `Rating Parameter` records.
   - Path: **Performance Rating > Rating Parameter > New**
   - Examples: Quality, Timeliness, Communication
2. Create a `Rating` setup based on those parameters.
   - Path: **Performance Rating > Rating > New**
   - Set **Doctype Type** (the document you want to rate).
   - Add rows in **Ratings** (table) with your `Rating Parameter` values.
   - Check **Is Active** so the setup can be used.
3. Create the business document you want to rate. Common examples:
   - `PO` (Purchase Order)
   - `SO` (Sales Order)
   - `GRN` (Goods Receipt Note)
   - `DN` (Delivery Note)
   - `SI` (Sales Invoice)
   - `PI` (Purchase Invoice)
4. Open the document and update ratings.
   - On refresh/status, a **Update Rating** dialog appears for supported doctypes.
   - Fill the scores and click **Save**.
5. View the auto-created `Rating Log`.
   - Path: **Performance Rating > Rating Log**
   - The log is created or updated automatically when you save ratings.

#### Field Behavior Notes

- **Party** is filtered by **Party From**.
- **Reference Name** is filtered by **Reference Type**.
- The `Ratings` table uses `Rating Log Item` rows to store the parameter + rating pairs.
- Saving ratings again for the same document replaces the previous log rows.
- If the document is cancelled or deleted, related rating logs are removed.

### License

mit
