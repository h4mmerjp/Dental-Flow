# Implementation Plan

- [ ] 1. Set up core type definitions and utilities
  - Create TypeScript interfaces for Patient data model
  - Implement age calculation utility function
  - Establish type safety foundation for the application
  - _Requirements: 5.1, 1.4_

- [ ] 2. Create authentication and layout components
  - [ ] 2.1 Implement Header component with user authentication display
    - Create Header component with Firebase Auth integration
    - Add logout functionality with confirmation dialog
    - Style with Tailwind CSS for responsive design
    - _Requirements: 4.2, 4.3, 4.4_

- [ ] 3. Implement patient data management layer
  - [ ] 3.1 Create usePatients custom hook for Firestore operations
    - Implement patient data fetching from Firestore
    - Add loading and error state management
    - Create query with proper ordering (patientId ascending)
    - Handle Firestore connection and error scenarios
    - _Requirements: 1.1, 1.2, 1.3, 1.5, 5.3_

  - [ ] 3.2 Add patient creation functionality to usePatients hook
    - Implement addPatient function in usePatients hook
    - Add Firestore document creation with serverTimestamp
    - Implement automatic list refresh after successful addition
    - Add proper error handling for creation failures
    - _Requirements: 3.2, 3.3, 3.5, 5.5_

- [ ] 4. Build patient list display and search functionality
  - [ ] 4.1 Create PatientListPage component with data display
    - Implement main patient list page component
    - Integrate usePatients hook for data fetching
    - Create patient table with required columns (ID, name, birthdate/age, last visit)
    - Add loading and error state displays
    - Style with Tailwind CSS for professional appearance
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 5.4_

  - [ ] 4.2 Implement patient search functionality
    - Add search input component with proper styling
    - Implement client-side filtering by name and patient ID
    - Add search state management and real-time filtering
    - Handle empty search results display
    - _Requirements: 2.1, 2.2, 2.3_

- [ ] 5. Create patient addition modal and form
  - [ ] 5.1 Build AddPatientModal component
    - Create modal component with form for patient data entry
    - Implement form state management for all patient fields
    - Add form validation for required fields
    - Create modal open/close functionality with backdrop
    - Style modal with Tailwind CSS for professional appearance
    - _Requirements: 3.1, 3.4, 5.4_

  - [ ] 5.2 Integrate form submission and validation
    - Connect form submission to usePatients addPatient function
    - Implement client-side validation with user feedback
    - Add loading states during form submission
    - Handle success and error scenarios with appropriate user messages
    - Reset form state after successful submission
    - _Requirements: 3.2, 3.3, 3.4, 3.5, 5.5_

- [ ] 6. Integrate modal with patient list page
  - Connect AddPatientModal to PatientListPage component
  - Implement modal state management (open/close)
  - Wire up "新規患者を追加" button to open modal
  - Pass addPatient function from usePatients hook to modal
  - Ensure proper component communication and state updates
  - _Requirements: 3.1, 3.2, 3.3_

- [ ] 7. Add comprehensive error handling and user feedback
  - Implement error boundaries for component error catching
  - Add proper error messages for all failure scenarios
  - Create consistent loading states across all components
  - Add success notifications for user actions
  - Ensure graceful degradation when services are unavailable
  - _Requirements: 1.2, 1.3, 3.5, 4.4, 5.5_

- [ ] 8. Create unit tests for core functionality
  - [ ] 8.1 Write tests for Patient type definitions and utilities
    - Test age calculation function with various birth dates
    - Test edge cases for age calculation (leap years, etc.)
    - Validate Patient interface type checking
    - _Requirements: 5.1, 1.4_

  - [ ] 8.2 Write tests for usePatients custom hook
    - Test patient data fetching functionality
    - Test loading and error state management
    - Test addPatient function with mock Firestore
    - Test hook state updates and re-renders
    - _Requirements: 5.3, 1.1, 3.2_

  - [ ] 8.3 Write tests for React components
    - Test Header component rendering and logout functionality
    - Test PatientListPage component with mock data
    - Test AddPatientModal form validation and submission
    - Test search functionality and filtering logic
    - _Requirements: 4.2, 1.4, 3.1, 2.1_