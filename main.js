export class MissingVariableError extends Error {

    #variableName

    /**
     * @param {string} variableName 
     */
    constructor(variableName)
    {
        super(`Variable \`${variableName}\` does not exist.`);
        this.#variableName = variableName;
    }

    /**
     * @returns {string}
     */
    get variableName()
    {
        return this.variableName;
    }
}

export class RequirementConflictError extends Error {

}

export class Variable {

    #name;
    #value;

    /**
     * @param {string} name 
     * @param {string} value 
     */
    constructor(name, value)
    {
        this.#name = name;
        this.#value = value;
    }

    /**
     * @returns {string}
     */
    get name()
    {
        return this.#name;
    }

    toString()
    {
        return this.#name + "=" + this.#value;
    }
}

export class Cflag {
    #value;

    /**
     * @param {string} value 
     */
    constructor(value)
    {
        this.#value = value;
    }

    toString()
    {
        return this.#value;
    }
}

export class Lib {

    #value;

    /**
     * @param {string} value 
     */
    constructor(value)
    {
        this.#value = value;
    }

    toString()
    {
        return this.#value;
    }
}

/**
 * @param {string} value
 * @returns {IterableIterator<RegExpMatchArray>}
 */
export function matchVariableNames(value)
{
    return value.matchAll(/(?<!\$)\$\{(.+?)\}/g);
}

/**
 * @param {string} value
 * @returns {string[]}
 */
export function parseVariableNames(value)
{
    return Array.from(matchVariableNames(value)).map(match => match[1]);
}

export class PC_Builder {

    #variables;
    #cflags;
    #cflagsPrivate;
    #libs;
    #libsPrivate;
    name;
    version;
    description;
    url;

    constructor()
    {
        this.#variables = [];
        this.#cflags = [];
        this.#cflagsPrivate = [];
        this.#libs = [];
        this.#libsPrivate = [];
        this.name = "";
        this.version = "1.0.0";
        this.description = "";
        this.url = "";
    }

    /**
     * @param {string} name
     * @param {string} value
     * @returns {Variable|MissingVariableError[]}
     */
    variableAdd(name, value)
    {
        const dependenciesNames = parseVariableNames(value);
        const missingVariableNames = dependenciesNames.filter(name => !this.#variables.find(variable => variable.name === name));
        if (missingVariableNames.length !== 0)
            return missingVariableNames.map(name => new MissingVariableError(name));
        const variable = new Variable(name, value);
        this.#variables.push(variable);
        return variable;
    }

    /**
     * @param {string} value 
     * @param {boolean|undefined} isPrivate 
     * @returns {Cflag|MissingVariableError[]}
     */
    cflagAdd(value, isPrivate)
    {
        const dependenciesNames = parseVariableNames(value);
        const missingVariableNames = dependenciesNames.filter(name => !this.#variables.find(variable => variable.name === name));
        if (missingVariableNames.length !== 0)
            return missingVariableNames.map(name => new MissingVariableError(name));
        const cflag = new Cflag(value);
        if (isPrivate === true)
            this.#cflagsPrivate.push(cflag);
        else
            this.#cflags.push(cflag);
        return cflag;
    }

    /**
     * @param {string} value 
     * @param {boolean|undefined} isPrivate 
     * @returns {Lib|MissingVariableError[]}
     */
    libAdd(value, isPrivate)
    {
        const dependenciesNames = parseVariableNames(value);
        const missingVariableNames = dependenciesNames.filter(name => !this.#variables.find(variable => variable.name === name));
        if (missingVariableNames.length !== 0)
            return missingVariableNames.map(name => new MissingVariableError(name));
        const lib = new Lib(value);
        if (isPrivate === true)
            this.#libsPrivate.push(lib);
        else
            this.#libs.push(lib);
        return lib;
    }

    build()
    {
        const properties = [
            `Name: ${this.name}`,
            `Version: ${this.version}`,
            `Description: ${this.description}`,
            `URL: ${this.url}`,
        ]
        if (this.#cflags.length !== 0)
            properties.push(`Cflags: ${this.#cflags.join(" ")}`);

        if (this.#cflagsPrivate.length !== 0)
            properties.push(`Cflags.private: ${this.#cflagsPrivate.join(" ")}`);

        if (this.#libs.length !== 0)
            properties.push(`Libs: ${this.#libs.join(" ")}`);

        if (this.#libsPrivate.length !== 0)
            properties.push(`Libs.private: ${this.#libsPrivate.join(" ")}`);

        return [ 
            ...this.#variables,
            "",
            ...properties
        ];
    }

    toString()
    {
        return this.build().join("\n");
    }
}