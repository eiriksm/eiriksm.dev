<?php

namespace eiriksm\Orkjern\Tests\Context;

use Behat\Behat\Tester\Exception\PendingException;
use Drupal\DrupalExtension\Context\RawDrupalContext;

class FeatureContext extends RawDrupalContext {

  private $lastIssueId;
  private $url;
  private $textContents;

  /**
   * @When I click the selector :selector
   */
  public function iClickTheSelector($selector) {
    $page = $this->getSession()->getPage();
    $element = $page->find('css', $selector);

    if (empty($element)) {
      throw new \Exception("No html element found for the selector ('$selector')");
    }

    $element->click();
  }

  /**
   * @Then selector :selector should not exist.
   */
  public function selectorShouldNotExist($selector) {
    $page = $this->getSession()->getPage();
    $element = $page->find('css', $selector);

    if (!empty($element)) {
      throw new \Exception("An element found for the selector ('$selector')");
    }
  }

  /**
   * @Then selector :selector should exist.
   */
  public function selectorShouldExist($selector) {
    $page = $this->getSession()->getPage();
    $element = $page->find('css', $selector);

    if (empty($element)) {
      throw new \Exception("No html element found for the selector ('$selector')");
    }
  }

  /**
   * @Then I remember the URL
   */
  public function iRememberTheUrl() {
    $this->url = $this->getSession()->getCurrentUrl();
  }

  /**
   * @Then I remember the text in element :selector as :name
   */
  public function iRememberTheTextInElementAs($selector, $name) {
    $page = $this->getSession()->getPage();
    $element = $page->find('css', $selector);
    $this->textContents[$name] = trim($element->getText());
  }

  /**
   * @Then I go to the last rememeber URL
   * @Then I go to the last remembered URL
   */
  public function iGoToTheLastRememeberUrl() {
    $this->getSession()->visit($this->url);
  }

  /**
   * @Then text in element :selector should equal stored text :name
   */
  public function textInElementShouldEqualStoredText($selector, $name) {
    $page = $this->getSession()->getPage();
    $element = $page->find('css', $selector);
    if (trim($element->getText()) != trim($this->textContents[$name])) {
      var_dump([
        'stored' => trim($this->textContents[$name]),
        'new' => trim($element->getText()),
      ]);
      throw new \Exception('Text did not equal stored text');
    }
  }

  /**
   * @Then text in element :selector should not equal stored text :name
   */
  public function textInElementShouldNotEqualStoredText($selector, $name) {
    $page = $this->getSession()->getPage();
    $element = $page->find('css', $selector);
    if (trim($element->getText()) == trim($this->textContents[$name])) {
      var_dump([
        'stored' => $this->textContents[$name],
        'new' => $element->getText(),
      ]);
      throw new \Exception('Text did equal stored text');
    }
  }

  /**
   * @When I wait for selector :selector to appear.
   */
  public function iWaitForSelectorToAppear($selector) {
    $page = $this->getSession()->getPage();
    $not_found = TRUE;
    $time = 0;
    while ($not_found) {
      $element = $page->find('css', $selector);
      $time++;
      if (!empty($element)) {
        $not_found = FALSE;
      }
      sleep(1);
      if ($time > 10) {
        throw new \Exception('Selector did not appear within 10 seconds');
      }
    }
  }

  /**
   * @Then /^I find the issue ID for the article$/
   */
  public function iFindTheIssueIDForTheArticle() {
    $element = $this->getSession()->getPage()->find('css', '.comment-link-wrapper a');
    $href = $element->getAttribute('href');
    $this->lastIssueId = str_replace('https://github.com/eiriksm/eiriksm.dev-comments/issues/', '', $href);
  }

  /**
   * @Then /^I create an empty comment file in the last issue$/
   */
  public function iCreateAnEmptyCommentFileInTheLastIssue() {
    $dir = __DIR__ . '/../../../public/ci_issues/' . $this->lastIssueId;
    @mkdir($dir);
    file_put_contents($dir . '/comments', '[]');
    $this->cacheBust();
  }

  protected function cacheBust() {

  }

  /**
   * @Then /^I wait (\d+) second$/
   */
  public function iWaitSecond($arg1) {
    sleep(1);
  }

  /**
   * @Then /^I place a comment in the last issue$/
   */
  public function iPlaceACommentInTheLastIssue() {
    $dir = __DIR__ . '/../../../public/ci_issues/' . $this->lastIssueId;
    @mkdir($dir);
    file_put_contents($dir . '/comments', '[
  {
    "id": "58d9674051",
    "node_id": "MDEyOklzc3VlQ29tbWVudDU4OTY3NDA1MQ==",
    "user": {
      "login": "eiriksm"
    },
    "created_at": "2020-02-21T14:23:19Z",
    "updated_at": "2020-02-21T14:23:19Z",
    "author_association": "OWNER",
    "body": "test comment there is no way a normal person can post this right?"
  }
]
');
    $this->cacheBust();
  }

}
