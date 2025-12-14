import React from "react"
import { Link } from "gatsby"

import Layout from "../components/layout"
import SEO from "../components/seo"

const PrivacyPolicy = () => (
  <Layout>
    <SEO title="Privacy Policy" />
    <article className="privacy-policy">
      <h1>Privacy Policy</h1>
      <p><em>Last updated: December 14, 2025</em></p>

      <p>
        This Privacy Policy explains how eiriksm.dev ("we", "us", or "our") collects, uses,
        and protects information when you visit <a href="https://eiriksm.dev">https://eiriksm.dev</a>.
      </p>

      <p>
        Our website provides printable coloring pages intended for parents, teachers, and
        caregivers to use with children. We do not knowingly collect personal information from children.
      </p>

      <h2>1. Information We Collect</h2>

      <h3>Personal Information</h3>
      <p>We may collect limited personal information when you voluntarily provide it, such as:</p>
      <ul>
        <li>Email address (for receiving free printables or updates)</li>
      </ul>
      <p>We do not collect names, ages, or any information directly from children.</p>

      <h3>Non-Personal Information</h3>
      <p>We automatically collect non-personal information, including:</p>
      <ul>
        <li>Browser type</li>
        <li>Device type</li>
        <li>Pages visited</li>
        <li>Referring website</li>
        <li>Approximate location (country/region)</li>
      </ul>
      <p>This information is used for analytics and site improvement.</p>

      <h2>2. Cookies and Web Beacons</h2>
      <p>eiriksm.dev uses cookies to:</p>
      <ul>
        <li>Store user preferences</li>
        <li>Understand how visitors interact with the site</li>
        <li>Serve advertisements</li>
      </ul>
      <p>You can disable cookies through your browser settings if you prefer.</p>

      <h2>3. Google AdSense</h2>
      <p>We use Google AdSense to display advertisements.</p>
      <p>Google may use cookies (including the DoubleClick cookie) to:</p>
      <ul>
        <li>Serve ads based on your visit to this and other websites</li>
        <li>Provide non-personalized ads appropriate for general audiences</li>
      </ul>
      <p>
        You can learn more about how Google manages data in advertising by visiting{" "}
        <a href="https://policies.google.com/technologies/ads" target="_blank" rel="noopener noreferrer">
          Google's advertising privacy resources
        </a>.
      </p>

      <h2>4. Children's Information</h2>
      <p>Protecting children's privacy is important to us.</p>
      <ul>
        <li>Our website is intended for adults (parents, teachers, caregivers)</li>
        <li>We do not knowingly collect personal data from children under 13</li>
        <li>We encourage parents and guardians to supervise children's online activities</li>
      </ul>
      <p>
        If you believe your child has provided personal information on our site, please contact
        us and we will promptly remove it.
      </p>

      <h2>5. Email Communications</h2>
      <p>If you choose to subscribe:</p>
      <ul>
        <li>Your email is used only to deliver requested content or updates</li>
        <li>You can unsubscribe at any time using the link in our emails</li>
        <li>We do not sell or share email addresses with third parties</li>
      </ul>

      <h2>6. Third-Party Privacy Policies</h2>
      <p>
        eiriksm.dev's Privacy Policy does not apply to other advertisers or websites.
      </p>
      <p>
        We recommend reviewing the Privacy Policies of third-party ad servers or websites for
        more detailed information about their practices.
      </p>

      <h2>7. Your Consent</h2>
      <p>By using our website, you consent to this Privacy Policy and agree to its terms.</p>

      <h2>8. Updates to This Policy</h2>
      <p>
        We may update this Privacy Policy from time to time. Any changes will be posted on
        this page with an updated revision date.
      </p>

      <h2>9. Contact Us</h2>
      <p>If you have any questions about this Privacy Policy, you can contact us at:</p>
      <ul>
        <li>Email: <a href="mailto:eirik@morland.no">eirik@morland.no</a></li>
        <li>Website: <a href="https://eiriksm.dev">https://eiriksm.dev</a></li>
      </ul>

      <p><Link to="/">Go back to the homepage</Link></p>
    </article>
  </Layout>
)

export default PrivacyPolicy
