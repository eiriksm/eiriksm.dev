@planet
Feature: Planet Drupal
  Scenario: The planet Drupal feed should be available
    Given I am an anonymous user
    When I am on "/planet"
    Then I should get a "200" HTTP response
