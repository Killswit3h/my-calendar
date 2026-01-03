## State Handling Guidelines

### Local vs. Global State

- **Local State**: Use local state for data that is only relevant within a single component. For example, form inputs or temporary UI states that do not need to be shared outside that component.

- **Global State**: Use global state for data that needs to be accessed by multiple components or different phases of the UI. For instance, track which project phase is currently selected so that all related views can stay in sync.

### Example Usage

- **Local State Example**: In a form component, manage the input values locally and submit them only when the user confirms.

- **Global State Example**: Use a global state (like React Context) to store the selected project phase so that the dashboard and detail views can both respond to it.
