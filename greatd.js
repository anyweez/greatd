const request = require('request-promise');
const Table = require('cli-table');
const crunch = require('./student');

const GROUP_ID = 230;
const TIY_API_KEY = process.argv[2];

function main() {
    function get(page = 0, records = []) {
        request({
            uri: `https://newline.theironyard.com/api/assignment_submissions`,
            qs: {
                group_id: GROUP_ID,
                page
            },
            json: true,
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${TIY_API_KEY}`,
            },
        }).then(resp => {
            // render(resp.data)
            records.push(...resp.data);

            if (resp.links.next !== null) {
                get(page + 1, records);
            } else {
                render(records);
            }
        });
    }

    console.log(`Requesting student data...`);
    get();
}

function render(results) {
    // Get rid of all retracted submissions; not relevant.
    const { assignments, rows } = crunch.byStudent(results.filter(r => r.status !== 'retracted'));

    let table = new Table({
        head: ['NAME', '# ASSIGNED', '% SUBMITTED', '% UNACCEPTABLE', 'RECORD'],
        chars: { 'mid': '', 'left-mid': '', 'mid-mid': '', 'right-mid': '' },
    });

    rows.forEach(row => table.push(row));

    console.log(table.toString());

    console.log('  ASSIGNMENTS ');
    console.log('  -------------');
    assignments.forEach((a, i) => {
        console.log(`  ${i + 1}. ${a.name}`);
    });
}

main();