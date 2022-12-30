import 'jasmine';
import {sample_function} from '../sample_function.js';
import {plv8} from 'plv8ts';

describe('sample function', () => {
  it('should return number of rows', () => {
    // Fake plv8.execute
    spyOn(plv8, 'execute').and.returnValues(
      // select event info
      [{event_name: 'foo', event_date_time: new Date(), event_location: 'bar'}],
      // update attendees
      [{user_id: 'a'}, {user_id: 'b'}],
      // select user info
      [
        {email: 'a@a.com', full_name: 'A'},
        {email: 'b@b.com', full_name: 'B'},
      ],
      // select email template
      [{value: 'email-template'}]
    );
    // Fake plv8.find_function with a spy
    const sendEmailSpy = jasmine.createSpy('sendEmail');
    spyOn(plv8, 'find_function').and.returnValue(sendEmailSpy);

    expect(sample_function(1)).toBe(2);
    expect(sendEmailSpy).toHaveBeenCalledWith({
      from: {
        email: 'admin@example.com',
        name: 'Admin',
      },
      template_id: 'email-template',
      personalizations: [
        {
          to: [
            {
              email: 'a@a.com',
              name: 'A',
            },
          ],
          dynamic_template_data: {
            event_name: 'foo',
            event_location: 'bar',
            event_date_time: jasmine.any(String),
          },
        },
        jasmine.any(Object),
      ],
    });
  });
});
