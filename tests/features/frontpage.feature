@frontpage
Feature: Front page
  Scenario: There should be more than 1 article on the frontpage.
    When I am on the homepage
    Then I should see "eiriksm.dev" in the "title" region
    And I should see 10 ".node--view-mode-teaser" elements
