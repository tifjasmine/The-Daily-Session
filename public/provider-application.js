(function () {
  const textOf = (element) => (element?.textContent || "").replace(/\s+/g, " ").trim();
  const valueOf = (form, labelText) => {
    const label = Array.from(form.querySelectorAll("label")).find((item) => textOf(item).startsWith(labelText));
    const field = label?.querySelector("input, textarea, select");
    return field?.value || "";
  };

  const selectedButtons = (group) =>
    Array.from(group?.querySelectorAll("button.is-selected") || []).map((button) => textOf(button).replace(/please email to discuss/i, "").trim());

  const selectedGroup = (form, groupLabel) => {
    const group = Array.from(form.querySelectorAll(".tds-provider-choice-group, .tds-provider-discount-grid")).find((item) =>
      textOf(item).startsWith(groupLabel)
    );
    return selectedButtons(group);
  };

  const ensureTextAreaAfter = (anchor, id, label, placeholder) => {
    if (!anchor || document.getElementById(id)) return;
    const wrapper = document.createElement("label");
    wrapper.className = "tds-provider-extra-field";
    wrapper.id = id;
    wrapper.textContent = label;
    const textarea = document.createElement("textarea");
    textarea.placeholder = placeholder;
    wrapper.appendChild(textarea);
    anchor.insertAdjacentElement("afterend", wrapper);
  };

  const removeById = (id) => document.getElementById(id)?.remove();

  const enhanceProviderForm = () => {
    const form = document.querySelector(".tds-provider-form");
    if (!form || form.dataset.providerEnhanced === "true") return;
    form.dataset.providerEnhanced = "true";

    const proof = document.querySelector(".tds-provider-proof");
    if (proof) proof.remove();

    const neighborhoodSelect = Array.from(form.querySelectorAll("select")).find((select) =>
      textOf(select.closest("label")).startsWith("Philadelphia neighborhood")
    );
    if (neighborhoodSelect) {
      const label = neighborhoodSelect.closest("label");
      const options = Array.from(neighborhoodSelect.options).map((option) => option.value).filter(Boolean);
      const choices = document.createElement("div");
      choices.className = "tds-provider-choice-group";
      choices.dataset.providerNeighborhood = "true";
      choices.innerHTML = "<span>Neighborhood *</span><small>Select all that apply.</small><div></div>";
      options.forEach((item) => {
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = item;
        button.addEventListener("click", () => button.classList.toggle("is-selected"));
        choices.querySelector("div").appendChild(button);
      });
      label.replaceWith(choices);
    }

    const discountGrid = form.querySelector(".tds-provider-discount-grid");
    if (discountGrid && !Array.from(discountGrid.querySelectorAll("button")).some((button) => textOf(button) === "No discounts")) {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = "No discounts";
      button.addEventListener("click", () => {
        discountGrid.querySelectorAll("button").forEach((item) => item.classList.remove("is-selected"));
        button.classList.add("is-selected");
      });
      discountGrid.appendChild(button);
    }

    form.addEventListener("click", () => {
      const servicesGroup = Array.from(form.querySelectorAll(".tds-provider-choice-group")).find((item) => textOf(item).startsWith("Services offered"));
      const insuranceGroup = Array.from(form.querySelectorAll(".tds-provider-choice-group")).find((item) => textOf(item).startsWith("Insurance accepted"));
      const services = selectedButtons(servicesGroup);
      const insurances = selectedButtons(insuranceGroup);
      if (services.includes("Other")) {
        ensureTextAreaAfter(servicesGroup, "tds-additional-services", "Additional services", "Type any other services here...");
      } else {
        removeById("tds-additional-services");
      }
      if (insurances.includes("Other")) {
        ensureTextAreaAfter(insuranceGroup, "tds-additional-insurance", "Other insurance accepted", "Type other accepted insurance here...");
      } else {
        removeById("tds-additional-insurance");
      }
    });

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      event.stopImmediatePropagation();
      let message = form.querySelector(".tds-business-success, .tds-business-error");
      if (!message) {
        message = document.createElement("p");
        form.querySelector(".tds-provider-submit")?.insertAdjacentElement("beforebegin", message);
      }
      if (message) {
        message.className = "tds-business-success";
        message.textContent = "Submitting your application...";
      }

      const payload = {
        practitionerName: valueOf(form, "Practitioner Name"),
        email: valueOf(form, "Email address"),
        phone: valueOf(form, "Phone number"),
        website: valueOf(form, "Website"),
        businessName: valueOf(form, "Business or practice name"),
        instagram: valueOf(form, "Instagram handle"),
        neighborhood: selectedGroup(form, "Neighborhood"),
        address: valueOf(form, "Address"),
        hours: valueOf(form, "Hours / Availability"),
        aboutBusiness: valueOf(form, "Tell us about your practice"),
        aboutPractitioner: valueOf(form, "Tell us about yourself"),
        providerType: valueOf(form, "Provider Type"),
        acceptsInsurance: valueOf(form, "Do you accept insurance?"),
        services: selectedGroup(form, "Services offered"),
        additionalServices: document.querySelector("#tds-additional-services textarea")?.value || "",
        serviceDetails: valueOf(form, "About your services"),
        insurances: selectedGroup(form, "Insurance accepted"),
        additionalInsurance: document.querySelector("#tds-additional-insurance textarea")?.value || "",
        paymentOptions: selectedGroup(form, "Payment options"),
        bookingLink: valueOf(form, "Direct booking link"),
        memberDiscount: selectedButtons(form.querySelector(".tds-provider-discount-grid"))[0] || "",
        photoName: valueOf(form, "Upload business photo"),
        signature: valueOf(form, "Typed Signature"),
        heardAbout: valueOf(form, "How did you hear about us?"),
        notes: valueOf(form, "Anything else you want us to know?")
      };

      try {
        const response = await fetch("/api/provider-applications", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(payload)
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(result.detail || result.error || "Application could not be saved.");
        if (message) message.textContent = "Application received. We will review it before it appears in the provider directory.";
      } catch (error) {
        if (message) {
          message.className = "tds-business-error";
          message.textContent = error instanceof Error ? error.message : "Application could not be saved.";
        }
      }
    }, true);
  };

  const runSoon = () => window.setTimeout(enhanceProviderForm, 120);
  window.addEventListener("popstate", runSoon);
  runSoon();
})();
