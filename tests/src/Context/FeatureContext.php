<?php

namespace eiriksm\Orkjern\Tests\Context;

use Drupal\DrupalExtension\Context\RawDrupalContext;

class FeatureContext extends RawDrupalContext {

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
    if ($element->getText() != $this->textContents[$name]) {
      var_dump([
        'stored' => $this->textContents[$name],
        'new' => $element->getText()
      ]);
      throw new \Exception('Text did not equal stored text');
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

}
