@javascript @navigation
Feature: Navigation
  Scenario: The navigation system is working
    When I am on the homepage
    And I click the selector ".node__title a"
    And I wait for selector ".article-body p:first-child" to appear.
    Then selector 'span[data-property="is-server-rendered"]' should not exist.
    And selector ".article-body p:first-child" should exist.

