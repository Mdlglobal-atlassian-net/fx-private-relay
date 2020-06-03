/* global browser */
/* global fillInputWithAlias */

function addRelayIconToInput(emailInput) {
  // remember the input's original parent element;
  const emailInputOriginalParentEl = emailInput.parentElement;

  // create new wrapping element;
  const emailInputWrapper = document.createElement("div");
  emailInputWrapper.classList.add("relay-email-input-wrapper");
  emailInputOriginalParentEl.insertBefore(emailInputWrapper, emailInput);

  // add padding to the input so that input text
  // is not covered up by the Relay icon
  emailInput.style.paddingRight = "50px";

  emailInputWrapper.appendChild(emailInput);

  const inputHeight = emailInput.clientHeight;

  const divEl = document.createElement("div");
  divEl.classList.add("relay-icon");
  divEl.style.height = inputHeight+"px";

  const buttonEl = document.createElement("button");
  buttonEl.id = "relay-button";
  buttonEl.classList.add("relay-button");
  buttonEl.type = "button";
  buttonEl.title = "Generate new email alias";

  const relayIconHeight = 30;
  if (relayIconHeight > inputHeight) {
    const smallIconSize = "24px";
    buttonEl.style.height = smallIconSize;
    buttonEl.style.width = smallIconSize;
    emailInput.style.paddingRight = "30px";
    divEl.style.right = "2px";
  }

  const createErrorMessage = (buttonElem, content) => {
    const errorMessageWrapper = document.createElement("div");
    errorMessageWrapper.classList.add("relay-error-message-wrapper");
    errorMessageWrapper.style.top = (relayIconHeight + 15)+"px";

    const errorMessage = document.createElement("p");
    errorMessage.classList.add("relay-error-message");

    errorMessage.textContent = content;
    errorMessageWrapper.appendChild(errorMessage);


    const dismissButton = document.createElement("button");
    dismissButton.classList.add("relay-error-dismiss");
    errorMessage.appendChild(dismissButton);

    dismissButton.addEventListener("click", () => {
      errorMessageWrapper.remove();
      buttonElem.classList.remove("relay-icon-disabled");
    });

    emailInputWrapper.appendChild(errorMessageWrapper);
    dismissButton.focus();
  };

  buttonEl.addEventListener("click", async (e) => {
    browser.runtime.sendMessage({
      method: "sendMetricsEvent",
      eventData: {
        category: "Addon Input Icon",
        action: "click",
      },
    })

    const newRelayAddressResponse = await browser.runtime.sendMessage({
      method: "makeRelayAddress",
      domain: document.location.hostname,
    });
    const errorMessageWrapper = document.querySelector(".relay-error-message-wrapper");
    if (errorMessageWrapper) {
      return errorMessageWrapper.remove();
    }
    if (newRelayAddressResponse.status === 402) {
      return createErrorMessage(buttonEl, "You already have 5 aliases.");
    }
    fillInputWithAlias(emailInput, newRelayAddressResponse);
  });

  divEl.appendChild(buttonEl);
  emailInputWrapper.appendChild(divEl);
}

function getEmailInputsAndAddIcon() {
  const getEmailInputs = document.querySelectorAll("input[type='email']");
  for (const emailInput of getEmailInputs) {
    if (!emailInput.parentElement.classList.contains("relay-email-input-wrapper")) {
      addRelayIconToInput(emailInput);
    }
  }
}

(function() {
  // Catch all immediately findable email inputs
  getEmailInputsAndAddIcon();

  // Catch email inputs that only become findable after
  // the entire page (including JS/CSS/images/etc) is fully loaded.
  window.addEventListener("load", () => {
    getEmailInputsAndAddIcon();
  });

  // Create a MutationObserver to watch for dynamically generated email inputs
  const mutationObserver = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      if (mutation.target.tagName === "FORM") {
        const emailInput = mutation.target.querySelector("input[type='email']");
        if (emailInput && !emailInput.parentElement.classList.contains("relay-email-input-wrapper")) {
          addRelayIconToInput(emailInput);
        }
      }
    });
  });

  mutationObserver.observe(document.body, { childList: true, subtree: true });

})();
