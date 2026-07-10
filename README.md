# Salonify

> A polished, modern salon booking platform designed to connect salon owners and customers through elegant digital experiences, intuitive booking flows, animated interfaces, and smart salon discovery tools.

---

## ✨ Welcome to Salonify

Salonify is a full-stack web application built to simplify the way salons manage appointments and how customers discover and book services. The project combines a refined React experience on the frontend with a robust Django backend, creating a platform that feels both professional and friendly.

This repository contains everything needed to run a salon booking system locally or in a containerized environment. The experience is shaped around convenience, trust, and visual clarity. Customers can browse salons, inspect services, make bookings, and review their history. Owners can manage services, working hours, bookings, portfolios, and salon identity. The project also supports QR-based salon discovery, allowing quick access to a salon’s digital presence with a simple scan.

The application is not just a booking form. It is a complete digital ecosystem for salon operations that has been thoughtfully designed to feel smooth from first visit to final confirmation.

---

## 🌈 Project Purpose

Salonify exists to solve a very practical problem: traditional salon booking can be slow, fragmented, and inconvenient. Customers often need to call, wait, or visit in person just to confirm availability. Salon owners, meanwhile, may struggle to manage bookings without a reliable system that centralizes appointments and customer communication.

This project brings those worlds together in one elegant workflow:

- Customers can discover salons quickly and reserve services online.
- Owners can manage availability, services, and appointments with less manual effort.
- The UI is designed to feel modern, accessible, and visually engaging.
- The backend is structured to support real-world salon operations rather than a toy demo.

The result is a platform that feels practical, polished, and ready for real usage.

---

## 🎯 Core Goals

Salonify was created with the following goals in mind:

- Create a fast and friendly booking experience for salon customers.
- Provide salon owners with a clear set of tools for daily operations.
- Support modern UI patterns, motion, and responsive layouts.
- Offer a backend that is easy to extend for future features.
- Include QR-based access and discovery for fast salon engagement.
- Make the system suitable for both local development and real deployment environments.

Every part of the project has been shaped around these goals.

---

## 🧠 What Makes Salonify Special

Salonify stands out because it combines several layers of functionality rather than focusing on a single feature.

- It blends a customer-facing experience with an owner-focused dashboard.
- It includes a multi-role system for customers, owners, staff, and administrators.
- It supports both booking flows and salon content management.
- It includes animated UI elements that make the interface feel lively and polished.
- It is designed with a strong emphasis on visual identity and user comfort.
- It supports salon discovery through direct browsing and QR-based routing.

This makes Salonify more than a booking app. It is a digital experience for the entire salon ecosystem.

---

## 🛍️ For Customers

Customers benefit from a simple and guided experience:

- Browse salons by city, context, and identity.
- Review salon details, services, and portfolios.
- Explore available services with clear pricing and duration.
- Book appointments without needing to call or wait for a callback.
- Track their bookings and stay informed about the status.
- Review salons and share their experience after service.

The booking process is designed to reduce friction while still feeling trustworthy and polished.

---

## 🧴 For Salon Owners

Salon owners are given tools that help them operate their business more efficiently:

- Add and manage services with pricing and durations.
- Define working hours for the business.
- Review incoming appointments and manage their statuses.
- Keep track of customer bookings in one place.
- Publish salon information, identity, and portfolio content.
- Maintain a digital presence that is easier to discover and remember.

The owner experience is structured to support the day-to-day needs of a service-based business.

---

## 👩‍🔧 For Staff and Admins

The platform is also suitable for internal operations and broader oversight:

- Staff can assist with booking handling and salon operations.
- Admin users can observe the overall application structure and content.
- The data model supports role-based separation and future expansion.
- The project is organized to allow more administrative workflows as the business grows.

This gives the system room to expand beyond a single salon owner use case.

---

## ✨ Feature Highlights

Salonify includes an impressive range of features that make it useful in real life:

- A beautiful, responsive landing experience.
- A modern single-page app structure with routing and state management.
- User authentication and account access.
- Role-based user handling for customers and owners.
- Salon and service management.
- Booking creation and booking review.
- Review and feedback collection.
- QR-code-driven salon access.
- Portfolio and showcase support for salon work.
- Responsive dashboard views.
- Dark and light visual themes.
- Smooth animated interactions.
- Persian-friendly formatting considerations and RTL-oriented design support.

These are not just decorative features. They reflect the practical needs of a salon platform.

---

## 🧩 Application Architecture

The project is divided into two major parts:

- The frontend is built with React and Vite to provide a dynamic and animated user interface.
- The backend is built with Django and Django REST Framework to provide a secure and extensible application layer.

The architecture is intentionally modular. The frontend handles the presentation and interaction layer while the backend manages data, authentication, business logic, and API communication.

This separation makes it easier to evolve each side independently as the system grows.

---

## 🏗️ Frontend Overview

The frontend layer is designed to be modern, responsive, and expressive.

- React provides the component-driven UI foundation.
- Vite offers a fast development experience and efficient build process.
- Framer Motion adds fluid transitions and interface animation.
- React Router manages navigation between pages.
- Axios handles API communication.
- Lucide icons provide a clean visual language.
- The interface supports rich visuals and smooth movement.

The frontend is built not only for function, but also for a sense of calm and beauty.

---

## 🧱 Backend Overview

The backend layer is responsible for storing and managing salon data.

- Django provides the main application framework.
- Django REST Framework powers the API layer.
- Authentication is handled with JWT-based tokens.
- Models represent users, salons, services, bookings, and reviews.
- Celery and Redis support asynchronous work and background tasks.
- The system is intended to be extendable for notifications, reminders, and other business logic.

The backend is designed to support both simple local development and more serious production setups.

---

## 🗄️ Main Data Models

Salonify uses a clear set of domain models:

- User: represents people using the platform, including customers, owners, staff, and admins.
- Salon: represents a salon business with profile information and identity.
- Service: defines the salon’s offerings, price, and duration.
- Booking: captures appointments and time-based reservations.
- Review: stores customer feedback and owner response data.
- Portfolio Category and Portfolio Item: support visual showcasing of salon work.
- Working Hours: define when a salon is open for appointments.

These models form the foundation of the business logic and the user experience.

---

## 💬 Booking Workflow

A typical booking experience in Salonify looks like this:

1. A customer opens the app and explores salons.
2. The customer chooses a salon and reviews its services.
3. The customer selects a service and desired appointment timing.
4. The booking is created and stored in the backend.
5. The system updates the booking state and returns confirmation information.
6. The customer can later view or manage the booking from their account.

The flow is simple but strong enough to support practical salon operations.

---

## 🚀 QR-Based Salon Discovery

One of Salonify’s most distinctive features is its QR-code-based salon access experience.

- A salon can have a unique QR code tied to its identity.
- Customers can scan the code and immediately reach the salon flow.
- This makes physical salon discovery much more direct and modern.
- The QR system helps bridge digital and in-person salon experiences.

This feature adds convenience and a sense of innovation to the platform.

---

## 🎨 Visual Design and Atmosphere

Salonify is designed to feel calm, stylish, and welcoming.

- The interface uses modern layout patterns.
- The project emphasizes clarity and visual balance.
- Motion effects help improve flow and reduce abrupt transitions.
- The experience is intended to feel polished on both desktop and mobile views.
- The system supports theming and flexible styling.

The visual language is meant to reflect the atmosphere of a high-quality salon environment.

---

## 🌙 Themes and UI Experience

The frontend includes a theme-conscious experience that supports multiple presentation modes:

- Light mode for brightness and clarity.
- Dark mode for comfort and modern styling.
- Consistent spacing and component styling.
- Smooth transitions between views.
- Responsive cards and panels for content presentation.

The visual experience makes the app feel more alive and intentional.

---

## 🧪 Technology Stack

Salonify uses a strong and modern toolchain:

- Frontend: React, Vite, React Router, Axios, Framer Motion, Lucide Icons, i18n support.
- Backend: Django, Django REST Framework, JWT authentication, Celery, Redis.
- Database: PostgreSQL in production and SQLite support for local simplicity.
- Infrastructure: Docker Compose for orchestrating services.
- Styling: modern CSS, component-based layout, responsive design principles.

This stack was chosen to balance speed, maintainability, and clear separation of concerns.

---

## 📁 Repository Structure

The repository is organized into a few core areas:

- backend/: Django project, API, business logic, database models, and background tasks.
- frontend/: React application, pages, styles, routing, and UI components.
- docs/: supporting documentation and screenshots.
- docker-compose.yml: container orchestration for the stack.
- package.json: root workspace metadata.

This structure keeps the project manageable while still supporting a full-stack experience.

---

## 📂 Backend Structure

The backend contains several important modules:

- accounts/: user models, roles, authentication-related logic.
- shops/: salons, services, portfolios, reviews, and salon metadata.
- bookings/: booking models, services, and booking-related workflows.
- common/: shared utilities, Celery setup, email, notification helpers, and middleware.
- salonify_backend/: Django project configuration and URL routing.

Each module has a focused responsibility, which helps the codebase stay understandable.

---

## 🧩 Frontend Structure

The frontend is organized around a clear experience model:

- pages/: route-level screens such as home, booking, login, signup, and dashboard views.
- components/: reusable UI parts such as headers, loading states, and shared interface blocks.
- context/: authentication and theme state.
- api/: API client and request handling.
- styles/: global styling and shared UI rules.
- utils/: helper functions and small logic modules.

This keeps the UI easy to navigate and extend.

---

## 🔐 Authentication and Authorization

Salonify uses a secure account model for different users:

- Users can register and log in.
- JWT tokens support authenticated requests.
- Protected routes prevent unauthorized access to owner and booking features.
- Different roles can be introduced and expanded over time.

This is an important part of making the platform reliable for real-world use.

---

## 🧾 API Design Principles

The backend exposes a structured API layer that supports frontend operations:

- Requests are organized around resource-based responsibilities.
- Authentication is required for sensitive actions.
- The API is intended to be consumed by a modern web client.
- The application can be extended to support mobile clients or additional services later.

A clear API structure helps keep the platform maintainable and scalable.

---

## 🧠 Business Logic Highlights

Several business rules are built into the platform:

- Services must be associated with a salon.
- Bookings rely on service and salon context.
- Prices and durations are tied to services.
- Reviews are linked to a salon and a user.
- Salon availability and working hours shape the booking experience.

These rules help create a realistic and dependable booking platform.

---

## ⏰ Working Hours and Availability

A salon’s schedule is central to booking success.

- Working hours can be defined by day of week.
- Services can be booked only within the salon’s operational window.
- Time management is a core part of the user experience.
- The data structure is flexible enough for real salon scheduling use cases.

This helps move the app beyond static listing features into a working booking workflow.

---

## 🧮 Pricing and Service Model

Salon services are modeled in a structured way:

- Each service belongs to a salon.
- Each service has a name, price, and duration.
- Prices are stored as decimal values for reliable financial handling.
- The platform can support service-level logic and future pricing rules.

This makes the model suitable for a practical salon business.

---

## 📝 Reviews and Reputation

Reviews are an important part of the platform because they help establish trust:

- Customers can leave feedback after using salon services.
- Reviews are connected to a salon and a user.
- Owners may respond to reviews in future product iterations.
- Review data can help improve the salon browsing journey.

This creates a more complete digital salon experience.

---

## 🖼️ Portfolio and Showcase Features

Salonify supports visual storytelling through portfolios:

- Salons can present categories of work.
- Portfolio items can be grouped and ordered.
- Visual content helps customers understand the salon’s style and quality.
- This feature improves the browsing experience and builds confidence.

The portfolio system adds personality to each salon page.

---

## 🚦 Local Development Setup

To run Salonify locally, you will need the basic runtime tools for both frontend and backend development.

- Node.js and npm are required for the React frontend.
- Python is required for the Django backend.
- Docker is recommended for an environment that matches the production-like stack.
- A package manager and shell access are needed to install dependencies and run commands.

The project is set up to be approachable for developers who want to explore or modify it.

---

## 🐳 Docker-Based Setup

The easiest way to run the full stack is through Docker Compose.

From the repository root, run:

```bash
docker compose up --build
```

This starts the main services for the app:

- Backend API
- Frontend UI
- PostgreSQL database
- Redis broker
- Celery worker

This is a convenient option for development and demonstration environments.

---

## 🧪 Backend Setup with Docker

Because the backend runs inside Docker, you do not need to start it directly with Python on your machine. Use Docker Compose to bring up the backend service together with its supporting services.

```bash
docker compose up --build backend postgres redis celery_worker
```

This starts the Django backend, PostgreSQL, Redis, and the Celery worker in containers.

If you want to inspect the backend container or run Django management commands, use:

```bash
docker compose exec backend sh
```

Inside the container, you can run commands such as:

```bash
python manage.py migrate
python manage.py createsuperuser
python manage.py collectstatic --noinput
```

You can also view backend logs with:

```bash
docker compose logs -f backend
```

This approach is the recommended way to work with the backend in this project.

---

## 🎨 Frontend Setup Manually

To run the frontend independently:

```bash
cd frontend
npm install
npm run dev
```

This starts the Vite development server and enables rapid UI iteration.

---

## 🔧 Environment Variables

The project expects a set of environment variables for configuration.

Important backend variables include:

- DJANGO_SECRET_KEY
- DJANGO_DEBUG
- POSTGRES_DB
- POSTGRES_USER
- POSTGRES_PASSWORD
- POSTGRES_HOST
- POSTGRES_PORT
- EMAIL_HOST
- EMAIL_PORT
- EMAIL_USE_TLS
- EMAIL_HOST_USER
- EMAIL_HOST_PASSWORD
- FRONTEND_URL
- REDIS_URL
- CELERY_BROKER_URL
- CELERY_RESULT_BACKEND

The frontend may use variables such as:

- VITE_API_URL

Environment configuration is important for reliable local runs and deployment readiness.

---

## ⚙️ Configuration Notes

Several configuration choices make the application flexible:

- The backend can use PostgreSQL for production-like environments.
- The backend can fall back to SQLite for easier local development.
- CORS settings support frontend origins during local testing.
- The project uses timezone-aware settings for a regional business context.
- The app is prepared for future deployment hardening and production environment refinement.

These details help the project feel more complete and realistic.

---

## 🧰 Suggested Development Workflow

A comfortable workflow for working on the project could be:

1. Start the backend and database services.
2. Launch the frontend in development mode.
3. Make changes to components or API endpoints.
4. Test features and verify the experience in the browser.
5. Review logs and fix issues incrementally.
6. Keep the project structure understandable as it grows.

This workflow encourages steady progress without losing focus on quality.

---

## 🧪 Testing and Validation

While the repository already contains a wide range of application features, testing and validation should remain a priority as the project evolves.

- Backend logic should be verified through model and API-level checks.
- UI behavior should be tested in the browser during feature work.
- Booking flows should be tested end to end.
- Authentication and protected routes should be validated carefully.
- QR-based flows should be tested from both the user and salon-owner perspectives.

Good testing habits will make future development safer and more dependable.

---

## 🧹 Code Quality Expectations

A project like Salonify benefits from disciplined code practices:

- Keep components focused and readable.
- Separate concerns between UI, API, and business logic.
- Use clear naming and consistent structure.
- Document important flows for future contributors.
- Refactor early when a module becomes too large or too tangled.

The codebase is already structured in a way that supports maintainability, especially when the team follows consistent patterns.

---

## 🧭 Future Enhancements

There is plenty of room for future growth:

- Add richer booking calendars and availability views.
- Improve notification systems for confirmations and reminders.
- Extend admin tooling for salon management.
- Add more robust analytics dashboards.
- Support online payments and deposit workflows.
- Add multilingual experience improvements.
- Strengthen deployment guides for production hosting.
- Expand QR-based experiences and marketing use cases.

The project has a strong foundation and a clear path for ongoing improvement.

---

## 📌 Quick Summary

If you want the shortest possible understanding of the project, here it is:

- Salonify is a salon booking platform.
- The frontend is React-based and animation-rich.
- The backend is Django-based and API-driven.
- Customers can browse salons and book services.
- Owners can manage salon operations.
- QR codes improve salon discovery and access.
- Docker makes the full stack easy to run.

That is the heart of the application in one compact view.

---

## 🌟 A Friendly Developer Note

This project is a strong example of how a modern web app can combine presentation and functionality in a balanced way. The visual side is important, but the real value lies in the experience it creates for users and salon operators. When you work in this codebase, you are not simply editing components or models. You are shaping a service that helps real businesses and real customers interact more smoothly.

That is what makes the project meaningful.

---

## 🪄 Design Philosophy

Salonify was shaped by a simple design philosophy:

- Make important actions feel obvious.
- Keep the experience uncluttered.
- Use motion to guide attention.
- Preserve clarity while adding elegance.
- Support real salon workflows rather than only mock interactions.

This philosophy is reflected in the structure of the UI, the order of interactions, and the tone of the product experience.

---

## 🎯 User Experience Principles

The project follows a few user experience principles that are worth preserving:

- Make booking steps feel lightweight and guided.
- Reduce uncertainty with clear service details.
- Keep navigation predictable.
- Provide feedback during actions.
- Make the interface welcoming rather than intimidating.

These principles are especially important in a service-based product where trust matters.

---

## 🧵 Project Personality

Salonify has a clear personality:

- Modern without being cold.
- Elegant without being overdesigned.
- Functional without being plain.
- Friendly without losing professionalism.

That balance is one of the project’s strongest qualities.

---

## 📚 Learning Points from the Project

Working with this repository can teach several valuable lessons:

- How to connect a React frontend to a Django backend.
- How to structure a multi-role application.
- How to model service-based businesses in a relational database.
- How to build a polished UI with motion and responsive design.
- How to support QR-based user journeys.
- How to create a containerized development environment.

These are useful patterns for many other full-stack products.

---

## 🧪 Example Development Scenarios

A few example tasks you might explore in this project include:

- Add a calendar-based booking view.
- Improve the salon owner dashboard with analytics.
- Add email reminders for upcoming bookings.
- Add payment support for deposits and prepayments.
- Improve QR-code experience with richer landing pages.
- Add admin moderation for reviews and salon content.
- Expand localization with additional language support.

The system is built to support these kinds of improvements.

---

## 🚧 Operational Considerations

If you plan to run the project for real-world use, a few operational concerns should be kept in mind:

- Secure the environment variables and secrets.
- Use a production-grade database when needed.
- Ensure media storage is handled properly.
- Monitor background tasks and worker health.
- Keep the frontend and backend versions aligned.
- Plan for deployment, backups, and system monitoring.

The project already has a solid base, but production readiness depends on continued care.

---

## 🧳 Getting Started Summary

If you are new to the repository, the best path is:

1. Review the project structure.
2. Start the backend and frontend environments.
3. Explore the salon and booking flows.
4. Read the main API and model files.
5. Make a small improvement or experiment.

That should give you a strong introduction to the platform.

---

## 🪁 A Note About the Visual Experience

The project uses a modern visual style that aims to feel pleasant and welcoming. Motion, spacing, hierarchy, and color are used to keep the interface lively without becoming distracting. This matters because salon services are personal and emotional, and the software should feel respectful and inviting.

That is why the user experience is not only functional but carefully styled.

---

## 🌍 Localization and Cultural Fit

The project includes considerations for Persian and RTL-friendly experience patterns. This demonstrates that the platform is designed with a specific user context in mind rather than being a generic template. That cultural and regional awareness makes the project more meaningful and usable for its intended audience.

This is a strong aspect of the overall product design.

---

## 🔗 Key Integration Points

Several integration points connect the frontend and backend:

- Authentication endpoints.
- Booking submission endpoints.
- Salon listing and detail endpoints.
- Service retrieval and management endpoints.
- Portfolio and review-related data access.
- QR code routing and salon lookup flows.

A healthy app depends on these links being clear and reliable.

---

## 🧱 Project Strengths

Salonify has several clear strengths:

- Clear purpose.
- Strong full-stack structure.
- Beautiful presentation.
- Practical service-based workflow.
- Modular code and architecture.
- Good fit for salon business needs.
- Room for future expansion.

These strengths make the repository valuable both as a product and as a learning resource.

---

## 🧠 What You Can Learn Here

This repository can be useful for developers who want to learn:

- How to build a polished multi-page app with React.
- How to structure database models for a service business.
- How to expose a REST API with Django.
- How to support authentication and role-based access.
- How to build a modern developer environment with Docker.
- How to design an app that balances aesthetics and business utility.

The project offers a rich learning experience beyond simple CRUD patterns.

---

## 🎉 Final Thoughts

Salonify is a thoughtful and modern application that demonstrates how well-designed software can improve everyday business processes. It combines booking, discovery, design, and service management into one cohesive journey. It is simple to understand from the outside, but rich enough to be genuinely useful in practice.

The repository is a strong foundation for building a real salon platform that feels polished, practical, and ready for future growth.


---

## 🪄 Closing Note

If you are exploring this repository, take your time with the structure and workflow. The app is designed to be both appealing and functional, and that balance is one of its greatest assets. Whether you are a developer, designer, product thinker, or salon business owner, Salonify offers a clear example of how technology can improve service-based experiences.

Thank you for reading, and enjoy exploring the project.
