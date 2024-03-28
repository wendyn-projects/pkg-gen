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

export class Item {

    #value;

    constructor(value)
    {
        this.#value = value;
    }

    /**
     * @returns {string}
     */
    get value()
    {
        return this.#value;
    }
}

export class Variable extends Item {

    #name;

    /**
     * @param {string} name 
     * @param {string} value 
     */
    constructor(name, value)
    {
        super(value)
        this.#name = name;
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
        return this.#name + "=" + this.value;
    }
}

export class Cflag extends Item {

    /**
     * @param {string} value 
     */
    constructor(value)
    {
        super(value);
    }

    toString()
    {
        return this.value;
    }
}

export class Lib extends Item {

    /**
     * @param {string} value 
     */
    constructor(value)
    {
        super(value);
    }

    toString()
    {
        return this.value;
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

export default class PkgGen {

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
        this.#variables = new Map();
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
    variableSet(name, value)
    {
        const dependenciesNames = parseVariableNames(value);
        const missingVariableNames = dependenciesNames.filter(name => !this.#variables.has(name));
        if (missingVariableNames.length !== 0)
            return missingVariableNames.map(name => new MissingVariableError(name));
        const variable = new Variable(name, value);
        this.#variables.set(name, variable);
        return variable;
    }

    /**
     * @param {string} name 
     * @returns {Item[]} list of conflicting items preventing the deletation.
     */
    variableDelete(name)
    {
        if (this.#variables.has(name))
        {
            const conflictingItems = [
                ...this.#variables.filter(variable => parseVariableNames(variable.value).includes(name)),
                ...this.#cflags.filter(variable => parseVariableNames(variable.value).includes(name)),
                ...this.#cflagsPrivate.filter(variable => parseVariableNames(variable.value).includes(name)),
                ...this.#libs.filter(variable => parseVariableNames(variable.value).includes(name)),
                ...this.#libsPrivate.filter(variable => parseVariableNames(variable.value).includes(name))
            ]
            if (conflictingItems.length === 0)
                this.#variables.delete(name);
            return conflictingItems;
        }
        return [];
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
     * @param {string|Cflag} value 
     * @param {boolean|undefined} isPrivate
     * @returns {Cflag|undefined}
     */
    cflagDelete(value, isPrivate) {
        let cflag;
        if (value instanceof Cflag)
            value = value.value;
        if (isPrivate === false || isPrivate === undefined)
        {
            const index = this.#cflags.findIndex(cflag => cflag.value === value);
            if (index !== -1)
            {
                cflag = this.#cflags[index];
                this.#cflags.splice(index, 1);
            }
        }
        if (isPrivate === true || isPrivate === undefined)
        {
            const index = this.#cflagsPrivate.findIndex(cflag => cflag.value === value);
            if (index !== -1)
            {
                cflag = this.#cflagsPrivate[index];
                this.#cflagsPrivate.splice(index, 1);
            }
        }
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

    /**
     * @param {string|Lib} value 
     * @param {boolean|undefined} isPrivate
     * @returns {Lib|undefined}
     */
    libDelete(value, isPrivate) {
        let lib;
        if (value instanceof Lib)
            value = value.value;
        if (isPrivate === false || isPrivate === undefined)
        {
            const index = this.#libs.findIndex(cflag => cflag.value === value);
            if (index !== -1)
            {
                lib = this.#libs[index];
                this.#libs.splice(index, 1);
            }
        }
        if (isPrivate === true || isPrivate === undefined)
        {
            const index = this.#libsPrivate.findIndex(cflag => cflag.value === value);
            if (index !== -1)
            {
                lib = this.#libsPrivate[index];
                this.#libsPrivate.splice(index, 1);
            }
        }
        return lib;
    }

    generate()
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

        return this.#variables.length === 0?
            properties :
            [ 
                ...this.#variables.values(),
                "",
                ...properties
            ];
    }

    toString()
    {
        return this.generate().join("\n");
    }
}