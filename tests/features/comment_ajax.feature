@javascript @comment-ajax
Feature: Comments are also loaded with ajax
  Scenario: The content should be the same, if the user uses javascript or not
    When I am on the homepage
    And I click the selector ".node__title a"
    # Now make sure we have 0 comments, even if there are some on github.
    Then I find the issue ID for the article
    Then I create an empty comment file in the last issue
    And I remember the URL
    Then I go to the last remembered URL
    And I wait for selector ".article-body p:first-child" to appear.
    And I remember the text in element ".comment-header .count" as "count"
    Then I create an empty comment file in the last issue
    And I remember the URL
    Then I go to the last remembered URL
    Then I wait 1 second
    Then text in element ".comment-header .count" should equal stored text "count"
    Then I place a comment in the last issue
    Then I go to the last remembered URL
    Then I wait 1 second
    Then text in element ".comment-header .count" should not equal stored text "count"
