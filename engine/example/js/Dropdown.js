export function createCustomDropdown(selectId) {
  const select = document.getElementById(selectId);
  if (!select) return null;

  //   select  
  select.style.display = 'none';

  //  Custom 
  const container = document.createElement('div');
  container.className = 'custom-dropdown';
  container.id = `${selectId}-custom-container`;
  
  //   Trigger
  const trigger = document.createElement('div');
  trigger.className = 'custom-dropdown-trigger';
  
  trigger.innerHTML = `
    <span class="custom-dropdown-text"></span>
    <svg class="custom-dropdown-arrow" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
  `;
  
  //   Menu
  const menu = document.createElement('div');
  menu.className = 'custom-dropdown-menu';
  
  container.appendChild(trigger);
  container.appendChild(menu);
  
  //   DOM  ，  select  
  select.parentNode.insertBefore(container, select.nextSibling);

  //  
  function updateTriggerDisplay(selectedOption) {
    if (!selectedOption) return;
    const iconContent = selectedOption.getAttribute('data-icon') || '';
    trigger.querySelector('.custom-dropdown-text').innerHTML = `
      ${iconContent ? `<svg class="custom-dropdown-trigger-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${iconContent}</svg>` : ''}
      <span>${selectedOption.textContent}</span>
    `;
  }

  //  
  function syncOptions() {
    menu.innerHTML = '';
    const children = Array.from(select.children);
    
    if (children.length === 0) {
      trigger.querySelector('.custom-dropdown-text').textContent = ' Item';
      return;
    }

    //  
    const selectedOption = select.options[select.selectedIndex] || select.querySelector('option') || children[0];
    updateTriggerDisplay(selectedOption);

    function createItem(opt) {
      const item = document.createElement('div');
      item.className = 'custom-dropdown-item';
      if (opt.value === select.value) {
        item.classList.add('selected');
      }
      
      const iconContent = opt.getAttribute('data-icon') || '';
      item.innerHTML = `
        ${iconContent ? `<svg class="custom-dropdown-item-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${iconContent}</svg>` : ''}
        <span class="custom-dropdown-item-text">${opt.textContent}</span>
      `;
      item.dataset.value = opt.value;
      
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        
        //   change  
        select.value = opt.value;
        select.dispatchEvent(new Event('change'));
        
        //   UI
        updateTriggerDisplay(opt);
        Array.from(menu.children).forEach(child => {
          if (child.classList.contains('custom-dropdown-item')) {
            child.classList.remove('selected');
          }
        });
        item.classList.add('selected');
        
        closeMenu();
      });
      
      menu.appendChild(item);
    }

    children.forEach((childNode) => {
      if (childNode.tagName === 'OPTGROUP') {
        const groupTitle = document.createElement('div');
        groupTitle.className = 'custom-dropdown-group-title';
        groupTitle.textContent = childNode.label;
        menu.appendChild(groupTitle);

        const opts = Array.from(childNode.querySelectorAll('option'));
        opts.forEach((opt) => {
          createItem(opt);
        });
      } else if (childNode.tagName === 'OPTION') {
        createItem(childNode);
      }
    });
  }

  function openMenu() {
    container.classList.add('active');
    document.addEventListener('click', handleOutsideClick);
  }

  function closeMenu() {
    container.classList.remove('active');
    document.removeEventListener('click', handleOutsideClick);
  }

  function handleOutsideClick(e) {
    if (!container.contains(e.target) && e.target !== select && !select.contains(e.target)) {
      closeMenu();
    }
  }

  trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    if (container.classList.contains('active')) {
      closeMenu();
    } else {
      //  
      document.querySelectorAll('.custom-dropdown.active').forEach(dropdown => {
        if (dropdown !== container) {
          dropdown.classList.remove('active');
        }
      });
      openMenu();
    }
  });

  // 1.   select   (  MutationObserver  )
  const observer = new MutationObserver(() => {
    syncOptions();
  });
  observer.observe(select, { childList: true, subtree: true });

  // 2.   select   ( ， )
  select.addEventListener('change', () => {
    const selectedOpt = select.options[select.selectedIndex];
    if (selectedOpt) {
      updateTriggerDisplay(selectedOpt);
      Array.from(menu.children).forEach(child => {
        if (child.dataset.value === select.value) {
          child.classList.add('selected');
        } else {
          child.classList.remove('selected');
        }
      });
    }
  });

  //  
  syncOptions();

  return {
    destroy() {
      observer.disconnect();
      container.remove();
      select.style.display = '';
    }
  };
}
