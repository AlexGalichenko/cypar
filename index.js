const glob = require('glob');
const { promise: fastq } = require('fastq');
const { program } = require('commander');
const { v4: uuidv4 } = require('uuid');
const cypress = require('cypress');

function parseArgs() {
    program.allowUnknownOption();
    program
        .option('-s, --spec <spec>', 'specs to run')
        .option('-p, --parallel <parallel>', 'level of parallelization', Number.parseInt);

    program.parse(process.argv);
    console.log(program);
}

function preprocessArgs(args) {
    return args
        .map(arg => arg.replace(/\[uuid]/g, uuidv4()))
}

async function worker({spec, args}) {
    const runOptions = await cypress.cli.parseRunArguments([
        'cypress',
        'run',
        '--spec',
        spec,
        ...preprocessArgs(args)
    ]);
    console.log(runOptions);
    await cypress.run(runOptions);
}

async function run(specs, concurrency = 1, args) {
    console.log('found specs:');
    console.log(specs);
    const q = fastq(worker, concurrency);

    for (const spec of specs) {
        q.push({spec, args})
    }

    await q.drained();
}

parseArgs();
const specs = glob.sync(program.spec);
run(specs, program.parallel, program.args);


