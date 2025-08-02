import React from "react";
import Layout from "@theme/Layout";
import Link from "@docusaurus/Link";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";

export default function Home(): React.JSX.Element {
  const { siteConfig } = useDocusaurusContext();
  return (
    <Layout
      title={`${siteConfig.title}`}
      description="secad is a corporate secreterial and administrative helper"
    >
      <main>
        <div className="container margin-vert--lg">
          <div className="row">
            <div className="col col--8 col--offset-2">
              <div className="text--center">
                <h1 className="hero__title">{siteConfig.title}</h1>
                <p className="hero__subtitle">{siteConfig.tagline}</p>
                <div className="margin-vert--lg">
                  <Link
                    className="button button--primary button--lg"
                    to="/docs/intro"
                  >
                    Get Started →
                  </Link>
                </div>
              </div>

              <div className="margin-vert--xl">
                <h2>What is it?</h2>
                <p>
                  <b>secad</b> (a corporate secreterial and administrative
                  helper) is designed to be a comprehensive web application for
                  managing backend corporate compliance.
                </p>

                <br />

                <h2>Key Features</h2>
                <span>
                  secad can help manage the following across multiple entities:
                </span>
                <ul>
                  <li>
                    <strong>Securities</strong>: Manage different classes of
                    securities (shares, units, etc.)
                  </li>
                  <li>
                    <strong>Transactions</strong>: Handle various transaction
                    types including:
                    <ul>
                      <li>Issue of new securities</li>
                      <li>Transfers between members</li>
                      <li>Redemptions and cancellations</li>
                      <li>Capital calls and returns</li>
                    </ul>
                  </li>
                  <li>
                    <strong>Resolutions</strong>: Record and track corporate
                    resolutions and decisions
                  </li>
                  <li>
                    <strong>Associates</strong>: Manage relationships between
                    entities and their associates
                  </li>
                </ul>

                <br />

                <div className="margin-vert--lg">
                  <Link
                    className="button button--secondary button--lg"
                    to="/docs/intro"
                  >
                    Read the Documentation
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </Layout>
  );
}
