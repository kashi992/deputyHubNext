import { NextResponse } from 'next/server';

export async function GET() {
  const sampleCsv = `Record Type,Salutation,First Name,Last Name,Company Name,Email,Primary Phone,Secondary Phone,Address,Company Registration,Stage,Tags
PERSON,Mrs,Berniece,Bahringer,Barton Boyer and Upton,your.email+fakedata45092@gmail.com,655-727-8198,088-053-8015,335 Gislason Parkway,,LEAD,
COMPANY,,,,Becker - Mueller,your.email+fakedata47704@gmail.com,246-972-2591,358-858-7834,82434 Janie Hills,Fisher and Sons,LEAD,
PERSON,Miss,Berniece,Shanahan,,your.email+fakedata45092@gmail.com,655-727-8198,088-053-8015,335 Gislason Parkway,,LEAD,`;

  return new NextResponse(sampleCsv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename=sample-contacts.csv'
    },
  });
}
