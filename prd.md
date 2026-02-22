# Product Requirements Document (PRD): Unit Management & Email Campaign System

## 1. Executive Summary
This document outlines the implementation of a dynamic Unit Management system and an enhanced Email Campaign tool for the Admin Dashboard. The system focuses on flexibility (bulk user addition), accountability (approval workflows), and professional communication (targeted email campaigns) with a modern dark-blue aesthetic.

## 2. Features & Requirements

### 2.1 Unit Management
- **Dynamic Creation**: Admins can create units (e.g., Technology, Product, Design).
- **CRUD Operations**: Support for renaming and deleting units.
- **Confirmations**: Every destructive action (delete) or significant change (rename) must be preceded by a confirmation modal.
- **Unassigned Users**: Support for users who do not belong to any specific unit.

### 2.2 Intern/User Management
- **Addition Methods**:
    - **Single**: Basic form with Name and Email.
    - **Bulk**: Smart parser for inputs like `Name, email@example.com` or `Name <email@example.com>` separated by commas or newlines.
- **Approval System**:
    - Default status is `Pending` (Approved: false).
    - Admins can `Approve` or `Reject` users individually.
    - Approval/Rejection triggers a confirmation modal.
- **Search & Filtering**:
    - Search by name/email.
    - Filter by Unit (All Units, Specific Unit, Unassigned).
    - Sub-filter by Status (Approved, Not Approved).

### 2.3 Email Campaign
- **Targeting**:
    - Send to **All Users** (with Approved/Not Approved/All sub-filters).
    - Send to **Specific Unit** (with Approved/Not Approved/All sub-filters).
- **Branding**:
    - Update current maroon theme (`#7A0019`) to **Dark Blue** (`#071936`).
    - Use `journal-rose` (`#E6F0FF`) for accents.
- **Attachments**:
    - Support for file attachments (images, PDFs, DOCX).
    - **Temporary Storage**: Files are deleted from the server immediately after the email campaign is sent.

## 3. User Interface (UI) Standards
- **Color Palette**: Dark Blue (`#071936`), Soft Blue (`#E6F0FF`), and White.
- **Components**: Use `shadcn/ui` for modals, buttons, and tables.
- **Intuitive UX**: Clear "Format Guides" for bulk inputs and tooltips for action buttons.

## 4. Technical Specifications
- **Database**: 
    - New `Unit` collection.
    - Updated `User` collection with `unit` (ObjectId) and `isApproved` (Boolean) fields.
- **Backend**:
    - New routes for `/admin/units`.
    - Enhanced `/admin/campaign/recipients` to handle unit filtering.
- **Cleanup**: 
    - Remove references to "Journal of Humanities".
    - Standardize all branding to "Journal of Science, Technology and Innovation".

## 5. Timeline & Strategy
1. **Model & Route Setup**: Define schemas and API endpoints.
2. **Unit Management UI**: Build the dashboard for creating/editing units.
3. **Intern Management UI**: Implement bulk addition and approval workflow.
4. **Email Campaign UI**: Update filters and theme.
5. **Cleanup & Final Polish**: Branding updates and file pruning.
