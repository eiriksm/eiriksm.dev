@javascript @no_js
Feature: No JS
  Scenario: The content should be the same, if the user uses javascript or not
    When I am on the homepage
    And I click the selector ".node__title a"
    # First load is ajax loaded.
    And I wait for selector ".article-body p:first-child" to appear.
    Then selector 'span[data-property="is-server-rendered"]' should not exist.
    And selector ".article-body p:first-child" should exist.
    And I remember the URL
    And I remember the text in element "#page-title" as "title"
    And I remember the text in element ".article-body" as "text"
    # THen load without ajax (manually)
    Then I go to the last remembered URL
    And selector ".article-body p:first-child" should exist.
    Then text in element ".article-body" should equal stored text "text"
    And text in element "#page-title" should equal stored text "title"
