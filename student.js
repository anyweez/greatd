
const status_map = {
    exceeds_expectations: '✔',
    complete_and_satisfactory: '✔',
    not_graded: '?',
    complete_and_unsatisfactory: 'x',
    incomplete: 'x',
    not_submitted: '-',
};

///////// Utility functions ////////////

/**
 * Returns the percentage of assignments that have been submitted, regardless
 * of their status (graded / ungraded).
 */
const pct_submitted = assignments => {
    const submitted = assignments.filter(a => a.status !== null).length;

    return (submitted * 100 / assignments.length).toFixed(2);
};

/**
 * Returns the percentage of assignments that have been marked as either 
 * 'complete_and_unsatisfactory' or 'incomplete'.
 */
const pct_unacceptable = assignments => {
    const unaccept = assignments.filter(a => {
        return a.status === 'complete_and_unsatisfactory' || a.status === 'incomplete';
    }).length;

    return (unaccept * 100 / assignments.length).toFixed(2);
}

const render_record = assignments => {
    return assignments.map(a => {
        if (a.status === null) {
            return status_map['not_submitted'];
        } else {
            if (status_map[a.status] === undefined) console.log(a.status);
            return status_map[a.status];
        }
    }).join(' ');
};

////////////////////////////////////////

function Student(id, name) {
    this.id = id;
    this.name = name;

    this.assignments = {};

    return this;
}

Student.prototype.register = function (assignment) {
    this.assignments[assignment.id] = Object.assign({}, assignment);
    this.assignments[assignment.id].status = null;
};

Student.prototype.add = function (assignment, status) {
    this.assignments[assignment.id].status = status;
};

Student.prototype.row = function () {
    let asn = Object
        .keys(this.assignments)
        .map(k => this.assignments[k])
        .sort((a, b) => a._id < b._id ? -1 : 1)

    return [
        this.name,                  // Student's name
        asn.length,                 // Number of assignments assigned
        pct_submitted(asn),         // Percent submitted
        pct_unacceptable(asn),      // Percent graded incomplete or unsatisfactory
        render_record(asn)          // Status per assignment
    ];
};

function Assignment(id, name, due) {
    this._id = `${due}-${id}`;
    this.id = id;
    this.name = name;
    this.due = due;

    this.students = {};

    return this;
}

const StudentById = {};
const AssignmentById = {};

const Students = [];
const Assignments = [];

module.exports = {
    byStudent(records) {
        records = records.filter(r => r.assignment.due_date !== null)

        // TODO: add due_date based unique ID to assignments

        records.forEach(r => {
            if (!StudentById.hasOwnProperty(r.student.id)) {
                const student = new Student(r.student.id, r.student.name);
                StudentById[student.id] = student;
                Students.push(student);
            }
        });

        records.forEach(r => {
            if (!AssignmentById.hasOwnProperty(r.assignment.id)) {
                const assignment = new Assignment(r.assignment.id, r.assignment.title, r.assignment.due_date);
                AssignmentById[assignment.id] = assignment;
                Assignments.push(assignment);
            }
        });

        // Sort in due date order (assignment ID as tiebreaker)
        Assignments.sort((a, b) => a._id < b._id ? -1 : 1);

        // Register each assignment with each student and vice versa.
        Students.forEach(s => {
            Assignments.forEach(a => s.register(a));
        });

        // Assignments.forEach(a => {
        //     Students.forEach(s => a.register(s));
        // });

        records.forEach(r => {
            const student = StudentById[r.student.id];
            const assignment = AssignmentById[r.assignment.id];

            student.add(assignment, r.status);
            // assignment.add(student, r.status);
        });

        return {
            rows: Students.map(s => s.row()),
            assignments: Assignments,
        };
    },
};

/*
module.exports = {
    byStudent(records) {
        // Unique list of all students.
        const students = Array.from(new Set(records.map(r => r.student.name))).sort();

        const seen_assignments = new Set();

        // 1. Select unique assignments using assignment ID.
        // 2. Convert to simpler objects for sorting.
        // 3. Get student status for each assignment.
        // 3. Sort.
        // 4. Map to assignment ID's.
        const assignments = records.filter(r => {
            if (!seen_assignments.has(r.assignment.id) && r.assignment.due_date) {
                seen_assignments.add(r.assignment.id);
                return true;
            }
            return false;
        }).map(r => {                           // 2. Convert to simpler objects.
            return {
                id: r.assignment.id,
                name: r.assignment.title,
                due: r.assignment.due_date,
                status: [],
            };
        }).map(a => {                           // 3. Get student status for each.
            a.status = students.map(s => {
                let rec = records.find(r => r.student.name === s && r.assignment.id === a.id);
                if (rec === undefined) return '-';
                return status_map[rec.status];
            });

            return a;
        }).sort((a, b) => {                     // 4. Sort all assignments.
            if (a.due < b.due) return -1;
            if (a.due > b.due) return 1;

            if (a.id < b.id) return -1;
            else return 1;
        }).map((a, i) => {                      // 5. Convert to sequential assignment #
            return { id: i, original_id: a.id, name: a.name, due: a.due, status: a.status };
        });

        // Compute a stat on a set of student records.
        const perStudent = (fn, i) => {
            return students.map(s => fn(records.filter(r => r.student.name === s)))[i];
        };

        const pct_submitted = records => {
            let submitted = new Set(records.map(r => r.assignment.id));
            let available = new Set(assignments.map(a => a.original_id));

            return submitted.length / available.length;
        };

        return {
            assignments,
            rows: students.map((s, i) => [s, perStudent(pct_submitted, i)]),
        };
    },
};
*/