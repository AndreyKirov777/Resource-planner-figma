
  # Resource Planning Application

  This is a code bundle for Resource Planning Application. The original project is available at https://www.figma.com/design/u7w7yez3OC7ZX2NiOwUqxS/Resource-Planning-Application.

  ## Features

  - **Resource Plan**: Plan and manage project resource allocations
  - **Resource List**: View and manage individual resources
  - **Rate Card**: View and manage rate cards with regional pricing using AG-Grid

  ### Rate Card Features

  The Rate Card page includes:
  - **Import Rate Card Button**: Ready for file import functionality (placeholder implementation)
  - **AG-Grid Table** with the following columns:
    - Role (text)
    - Naming in PM (text)
    - Discipline (text)
    - Description (text)
    - Ukraine (text)
    - Eastern Europe (text)
    - Asia (GE) (currency - $)
    - Asia (ARM, KZ) (currency - $)
    - LATAM (currency - $)
    - Mexico (currency - $)
    - India (currency - $)
    - New York (currency - $)
    - London (currency - $)

  The table includes features like:
  - Sorting and filtering
  - Pagination
  - Resizable columns
  - Currency formatting for rate columns
  - Sample data for demonstration

  ## Running the code

  Run `npm i` to install the dependencies.

  Run `npm run dev` to start the development server.
  