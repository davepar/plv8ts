import {plv8, smallint, int8, text, date, jsonb} from 'plv8ts';

// Rows returned from sql statements
type EventRow = {
  event_name: text;
  event_date_time: date;
  event_location: text;
};
type UpdatedRow = {
  user_id: text;
};
type UserDataRow = {
  email: text;
  full_name: text;
};

export function sample_function(event_id_param: int8): smallint {
  // plv8: security definer
  const event_rows = plv8.execute<EventRow>(
    `select e.name as event_name, e.date_time at time zone $2 as event_date_time,
      ep.location as event_location
      from events as e join events_private as ep on e.id = ep.id
      where e.id = $1
    `,
    [event_id_param, 'America/Los_Angeles']
  );
  if (event_rows.length < 1) {
    return 0;
  }
  const {event_name, event_date_time, event_location} = event_rows[0];

  // Update attendees from wait list
  const updated_rows = plv8.execute<UpdatedRow>(
    `update attendees as a
      set level = 'going'
      where a.event_id = $1 AND a.level = 'wait list'
      returning a.user_id
    `,
    [event_id_param]
  );
  // Send emails to new attendees
  if (updated_rows.length > 0) {
    const user_ids = updated_rows.map(row => row.user_id);
    const user_data_rows = plv8.execute<UserDataRow>(
      `select au.email, p.full_name
        from auth.users as au
          join profiles as p on au.id = p.id
        where au.id = any($1)
      `,
      [user_ids]
    );
    const localizedDateTime = event_date_time.toLocaleString('en-US');
    // Get template ID from the private.keys table.
    const template_id = plv8.execute<{value: string}>(
      "select value from private.keys where key = 'EMAIL_TEMPLATE_PROMOTE_ATTENDEE'"
    )[0].value;
    // Create the data structure that SendGrid expects.
    const personalizations = user_data_rows.map(({email, full_name}) => ({
      to: [
        {
          email,
          name: full_name,
        },
      ],
      dynamic_template_data: {
        event_name,
        event_location,
        event_date_time: localizedDateTime,
      },
    }));
    const payload = {
      from: {
        email: 'admin@example.com',
        name: 'Admin',
      },
      template_id,
      personalizations,
    };

    // The sample_send_email function expects a json payload and returns nothing.
    const send_email = plv8.find_function<(payload: jsonb) => void>(
      'private.sample_send_email'
    );
    send_email(payload);
  }
  return updated_rows.length;
}
