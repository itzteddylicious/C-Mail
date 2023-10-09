document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);
  document.querySelector('#compose-form').addEventListener('submit', submit_email);

  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email() {
  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

function submit_email(event) {
  event.preventDefault()

  // Post email to API route
  fetch('/emails/' , {
    method: 'POST',
    body: JSON.stringify({
      recipients: document.querySelector('#compose-recipients').value,
      subject: document.querySelector('#compose-subject').value,
      body: document.querySelector('#compose-body').value
    })
  })
  .then(response => load_mailbox('sent'));
}

function load_email(id) {
  fetch('/emails/' + id + '/')
  .then(response => response.json())
  .then(email => {

    // show email and hide other views
    document.querySelector('#emails-view').style.display = 'none';
    document.querySelector('#compose-view').style.display = 'none';
    document.querySelector('#email-view').style.display = 'block';

    // display email
    const view = document.querySelector('#email-view');
    view.innerHTML = `
      <ul class="list-group">
        <li class="list-group-item"><b>From:</b> <span>${email['sender']}</span></li>
        <li class="list-group-item"><b>To: </b><span>${email['recipients']}</span></li>
        <li class="list-group-item"><b>Subject:</b> <span>${email['subject']}</span</li>
        <li class="list-group-item"><b>Time:</b> <span>${email['timestamp']}</span></li>
      </ul>
      <p class="m-2 card card-body">${email['body']}</p>
    `;

    // create reply button & append to DOMContentLoaded
    const reply = document.createElement('button');
    reply.className = "btn-primary m-1 rounded-sm";
    reply.innerHTML = "Reply";
    reply.addEventListener('click', function() {
      compose_email();

      // populate fields with information from email
      document.querySelector('#compose-recipients').value = email['sender'];
      let subject = email['subject'];
      console.log(subject.split(" ", 1)[0]);
      if (subject.split(" ", 1)[0] != "Re:") {
        subject = "Re: " + subject;
      }
      document.querySelector('#compose-subject').value = subject;

      let body = `
        On ${email['timestamp']}, ${email['sender']} wrote: ${email['body']}
      `;
      document.querySelector('#compose-body').value = body;

    });

    view.appendChild(reply);

    // create archive button & append to DOM
    archiveButton = document.createElement('button');
    archiveButton.className = "btn-primary m-1 rounded-sm";
    archiveButton.innerHTML = !email['archived'] ? 'Archive' : 'Unarchive';
    archiveButton.addEventListener('click', function() {
      fetch('/emails/' + email['id'] + '/', {
        method: 'PUT',
        body: JSON.stringify({ archived : !email['archived'] })
      })
      .then(response => load_mailbox('inbox'))
    });
    view.appendChild(archiveButton);

    // Once the email has been clicked on, you should mark the email as read. 
    if (!email['read']) {
      fetch('/emails/' + email['id'] + '/', {
        method: 'PUT',
        body: JSON.stringify({ read : true })
      })
    }
  });
}

function load_mailbox(mailbox) {

  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'none';

  // Show the mailbox name & clear previous child elements
  const view = document.querySelector('#emails-view');
  view.innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;


  fetch('/emails/' + mailbox + '/')
  .then(response => response.json())
  .then(emails => {

    // generate div for each email
    emails.forEach(email => {
        let div = document.createElement('div');
        div.className = email['read'] ? "email-list-item-read" : "email-list-item-unread";
        div.innerHTML = `
            <span class="sender col-3"> <b>${email['sender']}</b> </span>
            <span class="subject col-6"> ${email['subject']} </span>
            <span class="timestamp col-3"> ${email['timestamp']} </span>
        `;

        // add listener and append to DOM
        div.addEventListener('click', () => load_email(email['id']));
        view.appendChild(div);
    });
  })
}
