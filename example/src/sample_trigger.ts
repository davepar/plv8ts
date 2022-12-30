import {plv8, NOTICE, integer, text, trigger, TG_OP, TG_ARGV} from 'plv8ts';

type MyTableRow = {
  // Either JS or plv8 types can be used here
  id: number;
  event_name: string;
  event_date_time: Date;
  event_location: text;
  attendee_limit: integer;
};

export function sample_trigger(
  NEW: MyTableRow,
  OLD: MyTableRow
): trigger<MyTableRow> {
  plv8.elog(NOTICE, 'NEW = ', JSON.stringify(NEW));
  plv8.elog(NOTICE, 'OLD = ', JSON.stringify(OLD));
  plv8.elog(NOTICE, 'TG_OP = ', TG_OP);
  plv8.elog(NOTICE, 'TG_ARGV = ', TG_ARGV);
  if (TG_OP === 'UPDATE') {
    NEW.id = 102;
    return NEW;
  }
}
