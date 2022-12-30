import {plv8, ERROR, jsonb} from 'plv8ts';

export function sample_send_email(payload: jsonb): void {
  let apiKey = '';
  try {
    apiKey = plv8.execute<{value: string}>(
      "select value from private.keys where key = 'SENDGRID_API_KEY'"
    )[0].value;
  } catch {
    plv8.elog(ERROR, 'Missing entry in private.keys');
  }

  // Example of calling the http function from the HTTP Postgres extension.
  const result = plv8.execute<{status: number; content: string}>(
    `select * from http((
      'POST',
      'https://api.sendgrid.com/v3/mail/send',
      ARRAY[http_header('Authorization', $1)],
      'application/json',
      $2
    )::http_request);`,
    ['Bearer ' + apiKey, JSON.stringify(payload)]
  );
  const {status, content} = result[0];
  if (status !== 202) {
    plv8.elog(ERROR, `Sending email failed ${status}/${content}`);
  }
}
