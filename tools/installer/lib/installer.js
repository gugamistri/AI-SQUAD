const path = require("node:path");
const fileManager = require("./file-manager");
const configLoader = require("./config-loader");
const ideSetup = require("./ide-setup");
const { extractYamlFromAgent } = require("../../lib/yaml-utils");

// Dynamic imports for ES modules
let chalk, ora, inquirer;

// Initialize ES modules
async function initializeModules() {
  if (!chalk) {
    chalk = (await import("chalk")).default;
    ora = (await import("ora")).default;
    inquirer = (await import("inquirer")).default;
  }
}

class Installer {
  async getCoreVersion() {
    const yaml = require("js-yaml");
    const fs = require("fs-extra");
    const coreConfigPath = path.join(__dirname, "../../../ai-squad-core/core-config.yaml");
    try {
      const coreConfigContent = await fs.readFile(coreConfigPath, "utf8");
      const coreConfig = yaml.load(coreConfigContent);
      return coreConfig.version || "unknown";
    } catch (error) {
      console.warn("Could not read version from core-config.yaml, using 'unknown'");
      return "unknown";
    }
  }

  async updateLanguageConfiguration(aiSquadCoreDestDir, languageCode) {
    const yaml = require("js-yaml");
    const fs = require("fs-extra");
    const coreConfigPath = path.join(aiSquadCoreDestDir, "core-config.yaml");
    
    try {
      // Read the current configuration
      const configContent = await fs.readFile(coreConfigPath, "utf8");
      const config = yaml.load(configContent);
      
      // Update the default language
      if (config.language) {
        config.language.default = languageCode;
      } else {
        // If language section doesn't exist, create it
        config.language = {
          default: languageCode,
          hitlMode: "adaptive",
          fallbackToEnglish: true,
          supportedLanguages: [
            "en", "es", "pt", "fr", "de", "it", 
            "zh-cn", "ja", "ko", "ru", "ar"
          ]
        };
      }
      
      // Write the updated configuration back
      const updatedContent = yaml.dump(config, { 
        indent: 2,
        lineWidth: -1,
        noRefs: true 
      });
      await fs.writeFile(coreConfigPath, updatedContent, "utf8");
      
      // Update agent names if language is not English
      if (languageCode !== 'en') {
        await this.updateAgentNames(aiSquadCoreDestDir, languageCode, config);
      }
      
    } catch (error) {
      console.warn(`Warning: Could not update language configuration: ${error.message}`);
    }
  }

  async updateAgentNames(aiSquadCoreDestDir, languageCode, config) {
    const fs = require("fs-extra");
    const path = require("path");
    
    if (!config.language || !config.language.agentNames) {
      return; // No agent names mapping available
    }
    
    const agentsDir = path.join(aiSquadCoreDestDir, "agents");
    const agentNames = config.language.agentNames;
    
    try {
      // Get list of agent files
      const agentFiles = await fs.readdir(agentsDir);
      
      for (const file of agentFiles) {
        if (!file.endsWith('.md')) continue;
        
        const agentId = path.basename(file, '.md');
        
        // Skip meta agents (they keep their technical names)
        if (agentId.includes('ai-squad')) continue;
        
        // Check if we have a localized name for this agent
        if (agentNames[agentId] && agentNames[agentId][languageCode]) {
          const localizedName = agentNames[agentId][languageCode];
          await this.updateAgentNameInFile(path.join(agentsDir, file), localizedName);
        }
      }
    } catch (error) {
      console.warn(`Warning: Could not update agent names: ${error.message}`);
    }
  }

  async updateAgentNameInFile(agentFilePath, newName) {
    const fs = require("fs-extra");
    
    try {
      let content = await fs.readFile(agentFilePath, "utf8");
      
      // Update the name field in the YAML header
      // Look for the pattern: name: [current name]
      const nameRegex = /(\s+name:\s+)([^\n\r]+)/;
      const match = content.match(nameRegex);
      
      if (match) {
        content = content.replace(nameRegex, `$1${newName}`);
        await fs.writeFile(agentFilePath, content, "utf8");
      } else {
        // If no name field exists, add it after the id field
        const idRegex = /(\s+id:\s+[^\n\r]+)/;
        const idMatch = content.match(idRegex);
        
        if (idMatch) {
          content = content.replace(idRegex, `$1\n  name: ${newName}`);
          await fs.writeFile(agentFilePath, content, "utf8");
        }
      }
    } catch (error) {
      console.warn(`Warning: Could not update name in ${agentFilePath}: ${error.message}`);
    }
  }

  async install(config) {
    // Initialize ES modules
    await initializeModules();
    
    const spinner = ora("Analyzing installation directory...").start();

    try {
      // Store the original CWD where npx was executed
      const originalCwd = process.env.INIT_CWD || process.env.PWD || process.cwd();
      
      // Resolve installation directory relative to where the user ran the command
      let installDir = path.isAbsolute(config.directory) 
        ? config.directory 
        : path.resolve(originalCwd, config.directory);
        
      if (path.basename(installDir) === '.ai-squad-core') {
        // If user points directly to .ai-squad-core, treat its parent as the project root
        installDir = path.dirname(installDir);
      }
      
      // Log resolved path for clarity
      if (!path.isAbsolute(config.directory)) {
        spinner.text = `Resolving "${config.directory}" to: ${installDir}`;
      }

      // Check if directory exists and handle non-existent directories
      if (!(await fileManager.pathExists(installDir))) {
        spinner.stop();
        console.log(chalk.yellow(`\nThe directory ${chalk.bold(installDir)} does not exist.`));
        
        const { action } = await inquirer.prompt([
          {
            type: 'list',
            name: 'action',
            message: 'What would you like to do?',
            choices: [
              {
                name: 'Create the directory and continue',
                value: 'create'
              },
              {
                name: 'Choose a different directory',
                value: 'change'
              },
              {
                name: 'Cancel installation',
                value: 'cancel'
              }
            ]
          }
        ]);

        if (action === 'cancel') {
          console.log(chalk.red('Installation cancelled.'));
          process.exit(0);
        } else if (action === 'change') {
          const { newDirectory } = await inquirer.prompt([
            {
              type: 'input',
              name: 'newDirectory',
              message: 'Enter the new directory path:',
              validate: (input) => {
                if (!input.trim()) {
                  return 'Please enter a valid directory path';
                }
                return true;
              }
            }
          ]);
          // Preserve the original CWD for the recursive call
          config.directory = newDirectory;
          return await this.install(config); // Recursive call with new directory
        } else if (action === 'create') {
          try {
            await fileManager.ensureDirectory(installDir);
            console.log(chalk.green(`✓ Created directory: ${installDir}`));
          } catch (error) {
            console.error(chalk.red(`Failed to create directory: ${error.message}`));
            console.error(chalk.yellow('You may need to check permissions or use a different path.'));
            process.exit(1);
          }
        }
        
        spinner.start("Analyzing installation directory...");
      }

      // If this is an update request from early detection, handle it directly
      if (config.installType === 'update') {
        const state = await this.detectInstallationState(installDir);
        if (state.type === 'v4_existing') {
          return await this.performUpdate(config, installDir, state.manifest, spinner);
        } else {
          spinner.fail('No existing v4 installation found to update');
          throw new Error('No existing v4 installation found');
        }
      }

      // Detect current state
      const state = await this.detectInstallationState(installDir);

      // Handle different states
      switch (state.type) {
        case "clean":
          return await this.performFreshInstall(config, installDir, spinner);

        case "v4_existing":
          return await this.handleExistingV4Installation(
            config,
            installDir,
            state,
            spinner
          );

        case "v3_existing":
          return await this.handleV3Installation(
            config,
            installDir,
            state,
            spinner
          );

        case "unknown_existing":
          return await this.handleUnknownInstallation(
            config,
            installDir,
            state,
            spinner
          );
      }
    } catch (error) {
      spinner.fail("Installation failed");
      throw error;
    }
  }

  async detectInstallationState(installDir) {
    // Ensure modules are initialized
    await initializeModules();
    const state = {
      type: "clean",
      hasV4Manifest: false,
      hasV3Structure: false,
      hasAiSquadCore: false,
      hasOtherFiles: false,
      manifest: null,
      expansionPacks: {},
    };

    // Check if directory exists
    if (!(await fileManager.pathExists(installDir))) {
      return state; // clean install
    }

    // Check for V4 installation (has .ai-squad-core with manifest)
    const aiSquadCorePath = path.join(installDir, ".ai-squad-core");
    const manifestPath = path.join(aiSquadCorePath, "install-manifest.yaml");

    if (await fileManager.pathExists(manifestPath)) {
      state.type = "v4_existing";
      state.hasV4Manifest = true;
      state.hasAiSquadCore = true;
      state.manifest = await fileManager.readManifest(installDir);
      return state;
    }

    // Check for V3 installation (has bmad-agent directory)
    const bmadAgentPath = path.join(installDir, "bmad-agent");
    if (await fileManager.pathExists(bmadAgentPath)) {
      state.type = "v3_existing";
      state.hasV3Structure = true;
      return state;
    }

    // Check for .ai-squad-core without manifest (broken V4 or manual copy)
    if (await fileManager.pathExists(aiSquadCorePath)) {
      state.type = "unknown_existing";
      state.hasAiSquadCore = true;
      return state;
    }

    // Check if directory has other files
    const glob = require("glob");
    const files = glob.sync("**/*", {
      cwd: installDir,
      nodir: true,
      ignore: ["**/.git/**", "**/node_modules/**"],
    });

    if (files.length > 0) {
      // Directory has other files, but no AI Squad installation.
      // Treat as clean install but record that it isn't empty.
      state.hasOtherFiles = true;
    }

    // Check for expansion packs (folders starting with .)
    const expansionPacks = await this.detectExpansionPacks(installDir);
    state.expansionPacks = expansionPacks;

    return state; // clean install
  }

  async performFreshInstall(config, installDir, spinner, options = {}) {
    // Ensure modules are initialized
    await initializeModules();
    spinner.text = "Installing AI Squad Method...";

    let files = [];

    if (config.installType === "full") {
      // Full installation - copy entire .ai-squad-core folder as a subdirectory
      spinner.text = "Copying complete .ai-squad-core folder...";
      const sourceDir = configLoader.getAiSquadCorePath();
      const aiSquadCoreDestDir = path.join(installDir, ".ai-squad-core");
      await fileManager.copyDirectory(sourceDir, aiSquadCoreDestDir);
      
      // Update language configuration if specified or if default language is not English
      const coreConfigPath = path.join(aiSquadCoreDestDir, "core-config.yaml");
      let shouldUpdateLanguage = false;
      let targetLanguage = 'en';
      
      if (config.language && config.language !== 'en') {
        // Language explicitly specified during installation
        shouldUpdateLanguage = true;
        targetLanguage = config.language;
      } else {
        // Check if core-config.yaml has a non-English default language
        try {
          const yaml = require("js-yaml");
          const fs = require("fs-extra");
          const configContent = await fs.readFile(coreConfigPath, "utf8");
          const coreConfig = yaml.load(configContent);
          
          if (coreConfig.language && coreConfig.language.default && coreConfig.language.default !== 'en') {
            shouldUpdateLanguage = true;
            targetLanguage = coreConfig.language.default;
          }
        } catch (error) {
          console.warn("Could not read core-config.yaml for language detection");
        }
      }
      
      if (shouldUpdateLanguage) {
        spinner.text = `Configuring language preferences (${targetLanguage})...`;
        await this.updateLanguageConfiguration(aiSquadCoreDestDir, targetLanguage);
      }
      
      // Copy common/ items to .ai-squad-core
      spinner.text = "Copying common utilities...";
      await this.copyCommonItems(installDir, ".ai-squad-core", spinner);

      // Get list of all files for manifest
      const glob = require("glob");
      files = glob
        .sync("**/*", {
          cwd: aiSquadCoreDestDir,
          nodir: true,
          ignore: ["**/.git/**", "**/node_modules/**"],
        })
        .map((file) => path.join(".ai-squad-core", file));
    } else if (config.installType === "single-agent") {
      // Single agent installation
      spinner.text = `Installing ${config.agent} agent...`;

      // Copy agent file
      const agentPath = configLoader.getAgentPath(config.agent);
      const destAgentPath = path.join(
        installDir,
        ".ai-squad-core",
        "agents",
        `${config.agent}.md`
      );
      await fileManager.copyFile(agentPath, destAgentPath);
      files.push(`.ai-squad-core/agents/${config.agent}.md`);

      // Copy dependencies
      const dependencies = await configLoader.getAgentDependencies(
        config.agent
      );
      const sourceBase = configLoader.getAiSquadCorePath();

      for (const dep of dependencies) {
        spinner.text = `Copying dependency: ${dep}`;

        if (dep.includes("*")) {
          // Handle glob patterns
          const copiedFiles = await fileManager.copyGlobPattern(
            dep.replace(".ai-squad-core/", ""),
            sourceBase,
            path.join(installDir, ".ai-squad-core")
          );
          files.push(...copiedFiles.map(f => `.ai-squad-core/${f}`));
        } else {
          // Handle single files
          const sourcePath = path.join(
            sourceBase,
            dep.replace(".ai-squad-core/", "")
          );
          const destPath = path.join(
            installDir,
            dep
          );

          if (await fileManager.copyFile(sourcePath, destPath)) {
            files.push(dep);
          }
        }
      }
      
      // Copy common/ items to .ai-squad-core
      spinner.text = "Copying common utilities...";
      const commonFiles = await this.copyCommonItems(installDir, ".ai-squad-core", spinner);
      files.push(...commonFiles);
    } else if (config.installType === "team") {
      // Team installation
      spinner.text = `Installing ${config.team} team...`;
      
      // Get team dependencies
      const teamDependencies = await configLoader.getTeamDependencies(config.team);
      const sourceBase = configLoader.getAiSquadCorePath();
      
      // Install all team dependencies
      for (const dep of teamDependencies) {
        spinner.text = `Copying team dependency: ${dep}`;
        
        if (dep.includes("*")) {
          // Handle glob patterns
          const copiedFiles = await fileManager.copyGlobPattern(
            dep.replace(".ai-squad-core/", ""),
            sourceBase,
            path.join(installDir, ".ai-squad-core")
          );
          files.push(...copiedFiles.map(f => `.ai-squad-core/${f}`));
        } else {
          // Handle single files
          const sourcePath = path.join(sourceBase, dep.replace(".ai-squad-core/", ""));
          const destPath = path.join(installDir, dep);
          
          if (await fileManager.copyFile(sourcePath, destPath)) {
            files.push(dep);
          }
        }
      }
      
      // Copy common/ items to .ai-squad-core
      spinner.text = "Copying common utilities...";
      const commonFiles = await this.copyCommonItems(installDir, ".ai-squad-core", spinner);
      files.push(...commonFiles);
    } else if (config.installType === "expansion-only") {
      // Expansion-only installation - DO NOT create .ai-squad-core
      // Only install expansion packs
      spinner.text = "Installing expansion packs only...";
    }

    // Install expansion packs if requested
    const expansionFiles = await this.installExpansionPacks(installDir, config.expansionPacks, spinner, config);
    files.push(...expansionFiles);

    // Install web bundles if requested
    if (config.includeWebBundles && config.webBundlesDirectory) {
      spinner.text = "Installing web bundles...";
      // Resolve web bundles directory using the same logic as the main installation directory
      const originalCwd = process.env.INIT_CWD || process.env.PWD || process.cwd();
      let resolvedWebBundlesDir = path.isAbsolute(config.webBundlesDirectory) 
        ? config.webBundlesDirectory 
        : path.resolve(originalCwd, config.webBundlesDirectory);
      await this.installWebBundles(resolvedWebBundlesDir, config, spinner);
    }

    // Set up IDE integration if requested
    const ides = config.ides || (config.ide ? [config.ide] : []);
    if (ides.length > 0) {
      for (const ide of ides) {
        spinner.text = `Setting up ${ide} integration...`;
        await ideSetup.setup(ide, installDir, config.agent, spinner);
      }
    }

    // Create manifest (skip for expansion-only installations)
    if (config.installType !== "expansion-only") {
      spinner.text = "Creating installation manifest...";
      await fileManager.createManifest(installDir, config, files);
    }

    spinner.succeed("Installation complete!");
    this.showSuccessMessage(config, installDir, options);
  }

  async handleExistingV4Installation(config, installDir, state, spinner) {
    // Ensure modules are initialized
    await initializeModules();
    spinner.stop();

    const currentVersion = state.manifest.version;
    const newVersion = await this.getCoreVersion();
    const versionCompare = this.compareVersions(currentVersion, newVersion);

    console.log(chalk.yellow("\n🔍 Found existing AI Squad v4 installation"));
    console.log(`   Directory: ${installDir}`);
    console.log(`   Current version: ${currentVersion}`);
    console.log(`   Available version: ${newVersion}`);
    console.log(
      `   Installed: ${new Date(
        state.manifest.installed_at
      ).toLocaleDateString()}`
    );

    // Check file integrity
    spinner.start("Checking installation integrity...");
    const integrity = await fileManager.checkFileIntegrity(installDir, state.manifest);
    spinner.stop();
    
    const hasMissingFiles = integrity.missing.length > 0;
    const hasModifiedFiles = integrity.modified.length > 0;
    const hasIntegrityIssues = hasMissingFiles || hasModifiedFiles;
    
    if (hasIntegrityIssues) {
      console.log(chalk.red("\n⚠️  Installation issues detected:"));
      if (hasMissingFiles) {
        console.log(chalk.red(`   Missing files: ${integrity.missing.length}`));
        if (integrity.missing.length <= 5) {
          integrity.missing.forEach(file => console.log(chalk.dim(`     - ${file}`)));
        }
      }
      if (hasModifiedFiles) {
        console.log(chalk.yellow(`   Modified files: ${integrity.modified.length}`));
        if (integrity.modified.length <= 5) {
          integrity.modified.forEach(file => console.log(chalk.dim(`     - ${file}`)));
        }
      }
    }

    // Show existing expansion packs
    if (Object.keys(state.expansionPacks).length > 0) {
      console.log(chalk.cyan("\n📦 Installed expansion packs:"));
      for (const [packId, packInfo] of Object.entries(state.expansionPacks)) {
        if (packInfo.hasManifest && packInfo.manifest) {
          console.log(`   - ${packId} (v${packInfo.manifest.version || 'unknown'})`);
        } else {
          console.log(`   - ${packId} (no manifest)`);
        }
      }
    }

    let choices = [];
    
    if (versionCompare < 0) {
      console.log(chalk.cyan("\n⬆️  Upgrade available for AI Squad core"));
      choices.push({ name: `Upgrade AI Squad core (v${currentVersion} → v${newVersion})`, value: "upgrade" });
    } else if (versionCompare === 0) {
      if (hasIntegrityIssues) {
        // Offer repair option when files are missing or modified
        choices.push({ 
          name: "Repair installation (restore missing/modified files)", 
          value: "repair" 
        });
      }
      console.log(chalk.yellow("\n⚠️  Same version already installed"));
      choices.push({ name: `Force reinstall AI Squad core (v${currentVersion} - reinstall)`, value: "reinstall" });
    } else {
      console.log(chalk.yellow("\n⬇️  Installed version is newer than available"));
      choices.push({ name: `Downgrade AI Squad core (v${currentVersion} → v${newVersion})`, value: "reinstall" });
    }
    
    choices.push(
      { name: "Add/update expansion packs only", value: "expansions" },
      { name: "Cancel", value: "cancel" }
    );

    const { action } = await inquirer.prompt([
      {
        type: "list",
        name: "action",
        message: "What would you like to do?",
        choices: choices,
      },
    ]);

    switch (action) {
      case "upgrade":
        return await this.performUpdate(config, installDir, state.manifest, spinner);
      case "repair":
        // For repair, restore missing/modified files while backing up modified ones
        return await this.performRepair(config, installDir, state.manifest, integrity, spinner);
      case "reinstall":
        // For reinstall, don't check for modifications - just overwrite
        return await this.performReinstall(config, installDir, spinner);
      case "expansions":
        // Ask which expansion packs to install
        const availableExpansionPacks = await this.getAvailableExpansionPacks();
        
        if (availableExpansionPacks.length === 0) {
          console.log(chalk.yellow("No expansion packs available."));
          return;
        }
        
        const { selectedPacks } = await inquirer.prompt([
          {
            type: 'checkbox',
            name: 'selectedPacks',
            message: 'Select expansion packs to install/update:',
            choices: availableExpansionPacks.map(pack => ({
              name: `${pack.name} v${pack.version} - ${pack.description}`,
              value: pack.id,
              checked: state.expansionPacks[pack.id] !== undefined
            }))
          }
        ]);
        
        if (selectedPacks.length === 0) {
          console.log(chalk.yellow("No expansion packs selected."));
          return;
        }
        
        spinner.start("Installing expansion packs...");
        const expansionFiles = await this.installExpansionPacks(installDir, selectedPacks, spinner, { ides: config.ides || [] });
        spinner.succeed("Expansion packs installed successfully!");
        
        console.log(chalk.green("\n✓ Installation complete!"));
        console.log(chalk.green(`✓ Expansion packs installed/updated:`));
        for (const packId of selectedPacks) {
          console.log(chalk.green(`  - ${packId} → .${packId}/`));
        }
        return;
      case "cancel":
        console.log("Installation cancelled.");
        return;
    }
  }

  async handleV3Installation(config, installDir, state, spinner) {
    // Ensure modules are initialized
    await initializeModules();
    spinner.stop();

    console.log(
      chalk.yellow("\n🔍 Found AI Squad v3 installation (bmad-agent/ directory)")
    );
    console.log(`   Directory: ${installDir}`);

    const { action } = await inquirer.prompt([
      {
        type: "list",
        name: "action",
        message: "What would you like to do?",
        choices: [
          { name: "Upgrade from v3 to v4 (recommended)", value: "upgrade" },
          { name: "Install v4 alongside v3", value: "alongside" },
          { name: "Cancel", value: "cancel" },
        ],
      },
    ]);

    switch (action) {
      case "upgrade": {
        console.log(chalk.cyan("\n📦 Starting v3 to v4 upgrade process..."));
        const V3ToV4Upgrader = require("../../upgraders/v3-to-v4-upgrader");
        const upgrader = new V3ToV4Upgrader();
        return await upgrader.upgrade({ 
          projectPath: installDir,
          ides: config.ides || [] // Pass IDE selections from initial config
        });
      }
      case "alongside":
        return await this.performFreshInstall(config, installDir, spinner);
      case "cancel":
        console.log("Installation cancelled.");
        return;
    }
  }

  async handleUnknownInstallation(config, installDir, state, spinner) {
    // Ensure modules are initialized
    await initializeModules();
    spinner.stop();

    console.log(chalk.yellow("\n⚠️  Directory contains existing files"));
    console.log(`   Directory: ${installDir}`);

    if (state.hasAiSquadCore) {
      console.log("   Found: .ai-squad-core directory (but no manifest)");
    }
    if (state.hasOtherFiles) {
      console.log("   Found: Other files in directory");
    }

    const { action } = await inquirer.prompt([
      {
        type: "list",
        name: "action",
        message: "What would you like to do?",
        choices: [
          { name: "Install anyway (may overwrite files)", value: "force" },
          { name: "Choose different directory", value: "different" },
          { name: "Cancel", value: "cancel" },
        ],
      },
    ]);

    switch (action) {
      case "force":
        return await this.performFreshInstall(config, installDir, spinner);
      case "different": {
        const { newDir } = await inquirer.prompt([
          {
            type: "input",
            name: "newDir",
            message: "Enter new installation directory:",
            default: path.join(path.dirname(installDir), "ai-squad-project"),
          },
        ]);
        config.directory = newDir;
        return await this.install(config);
      }
      case "cancel":
        console.log("Installation cancelled.");
        return;
    }
  }

  async performUpdate(newConfig, installDir, manifest, spinner) {
    spinner.start("Checking for updates...");

    try {
      // Get current and new versions
      const currentVersion = manifest.version;
      const newVersion = await this.getCoreVersion();
      const versionCompare = this.compareVersions(currentVersion, newVersion);
      
      // Only check for modified files if it's an actual version upgrade
      let modifiedFiles = [];
      if (versionCompare !== 0) {
        spinner.text = "Checking for modified files...";
        modifiedFiles = await fileManager.checkModifiedFiles(
          installDir,
          manifest
        );
      }

      if (modifiedFiles.length > 0) {
        spinner.warn("Found modified files");
        console.log(chalk.yellow("\nThe following files have been modified:"));
        for (const file of modifiedFiles) {
          console.log(`  - ${file}`);
        }

        const { action } = await inquirer.prompt([
          {
            type: "list",
            name: "action",
            message: "How would you like to proceed?",
            choices: [
              { name: "Backup and overwrite modified files", value: "backup" },
              { name: "Skip modified files", value: "skip" },
              { name: "Cancel update", value: "cancel" },
            ],
          },
        ]);

        if (action === "cancel") {
          console.log("Update cancelled.");
          return;
        }

        if (action === "backup") {
          spinner.start("Backing up modified files...");
          for (const file of modifiedFiles) {
            const filePath = path.join(installDir, file);
            const backupPath = await fileManager.backupFile(filePath);
            console.log(
              chalk.dim(`  Backed up: ${file} → ${path.basename(backupPath)}`)
            );
          }
        }
      }

      // Perform update by re-running installation
      spinner.text = versionCompare === 0 ? "Reinstalling files..." : "Updating files...";
      const config = {
        installType: manifest.install_type,
        agent: manifest.agent,
        directory: installDir,
        ides: newConfig?.ides || manifest.ides_setup || [],
      };

      await this.performFreshInstall(config, installDir, spinner, { isUpdate: true });
      
      // Clean up .yml files that now have .yaml counterparts
      spinner.text = "Cleaning up legacy .yml files...";
      await this.cleanupLegacyYmlFiles(installDir, spinner);
    } catch (error) {
      spinner.fail("Update failed");
      throw error;
    }
  }

  async performRepair(config, installDir, manifest, integrity, spinner) {
    spinner.start("Preparing to repair installation...");

    try {
      // Back up modified files
      if (integrity.modified.length > 0) {
        spinner.text = "Backing up modified files...";
        for (const file of integrity.modified) {
          const filePath = path.join(installDir, file);
          if (await fileManager.pathExists(filePath)) {
            const backupPath = await fileManager.backupFile(filePath);
            console.log(chalk.dim(`  Backed up: ${file} → ${path.basename(backupPath)}`));
          }
        }
      }

      // Restore missing and modified files
      spinner.text = "Restoring files...";
      const sourceBase = configLoader.getAiSquadCorePath();
      const filesToRestore = [...integrity.missing, ...integrity.modified];
      
      for (const file of filesToRestore) {
        // Skip the manifest file itself
        if (file.endsWith('install-manifest.yaml')) continue;
        
        const relativePath = file.replace('.ai-squad-core/', '');
        const destPath = path.join(installDir, file);
        
        // Check if this is a common/ file that needs special processing
        const commonBase = path.dirname(path.dirname(path.dirname(path.dirname(__filename))));
        const commonSourcePath = path.join(commonBase, 'common', relativePath);
        
        if (await fileManager.pathExists(commonSourcePath)) {
          // This is a common/ file - needs template processing
          const fs = require('fs').promises;
          const content = await fs.readFile(commonSourcePath, 'utf8');
          const updatedContent = content.replace(/\{root\}/g, '.ai-squad-core');
          await fileManager.ensureDirectory(path.dirname(destPath));
          await fs.writeFile(destPath, updatedContent, 'utf8');
          spinner.text = `Restored: ${file}`;
        } else {
          // Regular file from ai-squad-core
          const sourcePath = path.join(sourceBase, relativePath);
          if (await fileManager.pathExists(sourcePath)) {
            await fileManager.copyFile(sourcePath, destPath);
            spinner.text = `Restored: ${file}`;
            
            // If this is a .yaml file, check for and remove corresponding .yml file
            if (file.endsWith('.yaml')) {
              const ymlFile = file.replace(/\.yaml$/, '.yml');
              const ymlPath = path.join(installDir, ymlFile);
              if (await fileManager.pathExists(ymlPath)) {
                const fs = require('fs').promises;
                await fs.unlink(ymlPath);
                console.log(chalk.dim(`  Removed legacy: ${ymlFile} (replaced by ${file})`));
              }
            }
          } else {
            console.warn(chalk.yellow(`  Warning: Source file not found: ${file}`));
          }
        }
      }
      
      // Clean up .yml files that now have .yaml counterparts
      spinner.text = "Cleaning up legacy .yml files...";
      await this.cleanupLegacyYmlFiles(installDir, spinner);
      
      spinner.succeed("Repair completed successfully!");
      
      // Show summary
      console.log(chalk.green("\n✓ Installation repaired!"));
      if (integrity.missing.length > 0) {
        console.log(chalk.green(`  Restored ${integrity.missing.length} missing files`));
      }
      if (integrity.modified.length > 0) {
        console.log(chalk.green(`  Restored ${integrity.modified.length} modified files (backups created)`));
      }
      
      // Warning for Cursor custom modes if agents were repaired
      const ides = manifest.ides_setup || [];
      if (ides.includes('cursor')) {
        console.log(chalk.yellow.bold("\n⚠️  IMPORTANT: Cursor Custom Modes Update Required"));
        console.log(chalk.yellow("Since agent files have been repaired, you need to update any custom agent modes configured in the Cursor custom agent GUI per the Cursor docs."));
      }
      
    } catch (error) {
      spinner.fail("Repair failed");
      throw error;
    }
  }

  async performReinstall(config, installDir, spinner) {
    spinner.start("Preparing to reinstall AI Squad Method...");

    // Remove existing .ai-squad-core
    const aiSquadCorePath = path.join(installDir, ".ai-squad-core");
    if (await fileManager.pathExists(aiSquadCorePath)) {
      spinner.text = "Removing existing installation...";
      await fileManager.removeDirectory(aiSquadCorePath);
    }
    
    spinner.text = "Installing fresh copy...";
    const result = await this.performFreshInstall(config, installDir, spinner, { isUpdate: true });
    
    // Clean up .yml files that now have .yaml counterparts
    spinner.text = "Cleaning up legacy .yml files...";
    await this.cleanupLegacyYmlFiles(installDir, spinner);
    
    return result;
  }

  showSuccessMessage(config, installDir, options = {}) {
    console.log(chalk.green("\n✓ AI Squad Method installed successfully!\n"));

    const ides = config.ides || (config.ide ? [config.ide] : []);
    if (ides.length > 0) {
      for (const ide of ides) {
        const ideConfig = configLoader.getIdeConfiguration(ide);
        if (ideConfig?.instructions) {
          console.log(
            chalk.bold(`To use AI Squad agents in ${ideConfig.name}:`)
          );
          console.log(ideConfig.instructions);
        }
      }
    } else {
      console.log(chalk.yellow("No IDE configuration was set up."));
      console.log(
        "You can manually configure your IDE using the agent files in:",
        installDir
      );
    }

    // Information about installation components
    console.log(chalk.bold("\n🎯 Installation Summary:"));
    if (config.installType !== "expansion-only") {
      console.log(chalk.green("✓ .ai-squad-core framework installed with all agents and workflows"));
    }
    
    if (config.expansionPacks && config.expansionPacks.length > 0) {
      console.log(chalk.green(`✓ Expansion packs installed:`));
      for (const packId of config.expansionPacks) {
        console.log(chalk.green(`  - ${packId} → .${packId}/`));
      }
    }
    
    if (config.includeWebBundles && config.webBundlesDirectory) {
      const bundleInfo = this.getWebBundleInfo(config);
      // Resolve the web bundles directory for display
      const originalCwd = process.env.INIT_CWD || process.env.PWD || process.cwd();
      const resolvedWebBundlesDir = path.isAbsolute(config.webBundlesDirectory) 
        ? config.webBundlesDirectory 
        : path.resolve(originalCwd, config.webBundlesDirectory);
      console.log(chalk.green(`✓ Web bundles (${bundleInfo}) installed to: ${resolvedWebBundlesDir}`));
    }
    
    if (ides.length > 0) {
      const ideNames = ides.map(ide => {
        const ideConfig = configLoader.getIdeConfiguration(ide);
        return ideConfig?.name || ide;
      }).join(", ");
      console.log(chalk.green(`✓ IDE rules and configurations set up for: ${ideNames}`));
    }

    // Information about web bundles
    if (!config.includeWebBundles) {
      console.log(chalk.bold("\n📦 Web Bundles Available:"));
      console.log("Pre-built web bundles are available and can be added later:");
      console.log(chalk.cyan("  Run the installer again to add them to your project"));
      console.log("These bundles work independently and can be shared, moved, or used");
      console.log("in other projects as standalone files.");
    }

    if (config.installType === "single-agent") {
      console.log(
        chalk.dim(
          "\nNeed other agents? Run: npx ai-squad install --agent=<name>"
        )
      );
      console.log(
        chalk.dim("Need everything? Run: npx ai-squad install --full")
      );
    }

    // Warning for Cursor custom modes if agents were updated
    if (options.isUpdate && ides.includes('cursor')) {
      console.log(chalk.yellow.bold("\n⚠️  IMPORTANT: Cursor Custom Modes Update Required"));
      console.log(chalk.yellow("Since agents have been updated, you need to update any custom agent modes configured in the Cursor custom agent GUI per the Cursor docs."));
    }
  }

  // Legacy method for backward compatibility
  async update() {
    // Initialize ES modules
    await initializeModules();
    console.log(chalk.yellow('The "update" command is deprecated.'));
    console.log(
      'Please use "install" instead - it will detect and offer to update existing installations.'
    );

    const installDir = await this.findInstallation();
    if (installDir) {
      const config = {
        installType: "full",
        directory: path.dirname(installDir),
        ide: null,
      };
      return await this.install(config);
    }
    console.log(chalk.red("No AI Squad installation found."));
  }

  async listAgents() {
    // Initialize ES modules
    await initializeModules();
    const agents = await configLoader.getAvailableAgents();

    console.log(chalk.bold("\nAvailable AI Squad Agents:\n"));

    for (const agent of agents) {
      console.log(chalk.cyan(`  ${agent.id.padEnd(20)}`), agent.description);
    }

    console.log(
      chalk.dim("\nInstall with: npx ai-squad install --agent=<id>\n")
    );
  }

  async listExpansionPacks() {
    // Initialize ES modules
    await initializeModules();
    const expansionPacks = await this.getAvailableExpansionPacks();

    console.log(chalk.bold("\nAvailable AI Squad Expansion Packs:\n"));

    if (expansionPacks.length === 0) {
      console.log(chalk.yellow("No expansion packs found."));
      return;
    }

    for (const pack of expansionPacks) {
      console.log(chalk.cyan(`  ${pack.id.padEnd(20)}`), 
                  `${pack.name} v${pack.version}`);
      console.log(chalk.dim(`  ${' '.repeat(22)}${pack.description}`));
      if (pack.author && pack.author !== 'Unknown') {
        console.log(chalk.dim(`  ${' '.repeat(22)}by ${pack.author}`));
      }
      console.log();
    }

    console.log(
      chalk.dim("Install with: npx ai-squad install --full --expansion-packs <id>\n")
    );
  }

  async showStatus() {
    // Initialize ES modules
    await initializeModules();
    const installDir = await this.findInstallation();

    if (!installDir) {
      console.log(
        chalk.yellow("No AI Squad installation found in current directory tree")
      );
      return;
    }

    const manifest = await fileManager.readManifest(installDir);

    if (!manifest) {
      console.log(chalk.red("Invalid installation - manifest not found"));
      return;
    }

    console.log(chalk.bold("\nAI Squad Installation Status:\n"));
    console.log(`  Directory:      ${installDir}`);
    console.log(`  Version:        ${manifest.version}`);
    console.log(
      `  Installed:      ${new Date(
        manifest.installed_at
      ).toLocaleDateString()}`
    );
    console.log(`  Type:           ${manifest.install_type}`);

    if (manifest.agent) {
      console.log(`  Agent:          ${manifest.agent}`);
    }

    if (manifest.ides_setup && manifest.ides_setup.length > 0) {
      console.log(`  IDE Setup:      ${manifest.ides_setup.join(', ')}`);
    }

    console.log(`  Total Files:    ${manifest.files.length}`);

    // Check for modifications
    const modifiedFiles = await fileManager.checkModifiedFiles(
      installDir,
      manifest
    );
    if (modifiedFiles.length > 0) {
      console.log(chalk.yellow(`  Modified Files: ${modifiedFiles.length}`));
    }

    console.log("");
  }

  async getAvailableAgents() {
    return configLoader.getAvailableAgents();
  }

  async getAvailableExpansionPacks() {
    return configLoader.getAvailableExpansionPacks();
  }

  async getAvailableTeams() {
    return configLoader.getAvailableTeams();
  }

  async installExpansionPacks(installDir, selectedPacks, spinner, config = {}) {
    if (!selectedPacks || selectedPacks.length === 0) {
      return [];
    }

    const installedFiles = [];
    const glob = require('glob');

    for (const packId of selectedPacks) {
      spinner.text = `Installing expansion pack: ${packId}...`;
      
      try {
        const expansionPacks = await this.getAvailableExpansionPacks();
        const pack = expansionPacks.find(p => p.id === packId);
        
        if (!pack) {
          console.warn(`Expansion pack ${packId} not found, skipping...`);
          continue;
        }
        
        // Check if expansion pack already exists
        let expansionDotFolder = path.join(installDir, `.${packId}`);
        const existingManifestPath = path.join(expansionDotFolder, 'install-manifest.yaml');
        
        if (await fileManager.pathExists(existingManifestPath)) {
          spinner.stop();
          const existingManifest = await fileManager.readExpansionPackManifest(installDir, packId);
          
          console.log(chalk.yellow(`\n🔍 Found existing ${pack.name} installation`));
          console.log(`   Current version: ${existingManifest.version || 'unknown'}`);
          console.log(`   New version: ${pack.version}`);
          
          // Check integrity of existing expansion pack
          const packIntegrity = await fileManager.checkFileIntegrity(installDir, existingManifest);
          const hasPackIntegrityIssues = packIntegrity.missing.length > 0 || packIntegrity.modified.length > 0;
          
          if (hasPackIntegrityIssues) {
            console.log(chalk.red("   ⚠️  Installation issues detected:"));
            if (packIntegrity.missing.length > 0) {
              console.log(chalk.red(`     Missing files: ${packIntegrity.missing.length}`));
            }
            if (packIntegrity.modified.length > 0) {
              console.log(chalk.yellow(`     Modified files: ${packIntegrity.modified.length}`));
            }
          }
          
          const versionCompare = this.compareVersions(existingManifest.version || '0.0.0', pack.version);
          
          if (versionCompare === 0) {
            console.log(chalk.yellow('   ⚠️  Same version already installed'));
            
            const choices = [];
            if (hasPackIntegrityIssues) {
              choices.push({ name: 'Repair (restore missing/modified files)', value: 'repair' });
            }
            choices.push(
              { name: 'Force reinstall (overwrite)', value: 'overwrite' },
              { name: 'Skip this expansion pack', value: 'skip' },
              { name: 'Cancel installation', value: 'cancel' }
            );
            
            const { action } = await inquirer.prompt([{
              type: 'list',
              name: 'action',
              message: `${pack.name} v${pack.version} is already installed. What would you like to do?`,
              choices: choices
            }]);
            
            if (action === 'skip') {
              spinner.start();
              continue;
            } else if (action === 'cancel') {
              console.log(chalk.red('Installation cancelled.'));
              process.exit(0);
            } else if (action === 'repair') {
              // Repair the expansion pack
              await this.repairExpansionPack(installDir, packId, pack, packIntegrity, spinner);
              continue;
            }
          } else if (versionCompare < 0) {
            console.log(chalk.cyan('   ⬆️  Upgrade available'));
            
            const { proceed } = await inquirer.prompt([{
              type: 'confirm',
              name: 'proceed',
              message: `Upgrade ${pack.name} from v${existingManifest.version} to v${pack.version}?`,
              default: true
            }]);
            
            if (!proceed) {
              spinner.start();
              continue;
            }
          } else {
            console.log(chalk.yellow('   ⬇️  Installed version is newer than available version'));
            
            const { action } = await inquirer.prompt([{
              type: 'list',
              name: 'action',
              message: 'What would you like to do?',
              choices: [
                { name: 'Keep current version', value: 'skip' },
                { name: 'Downgrade to available version', value: 'downgrade' },
                { name: 'Cancel installation', value: 'cancel' }
              ]
            }]);
            
            if (action === 'skip') {
              spinner.start();
              continue;
            } else if (action === 'cancel') {
              console.log(chalk.red('Installation cancelled.'));
              process.exit(0);
            }
          }
          
          // If we get here, we're proceeding with installation
          spinner.start(`Removing old ${pack.name} installation...`);
          await fileManager.removeDirectory(expansionDotFolder);
        }

        const expansionPackDir = pack.packPath;
        
        // Ensure dedicated dot folder exists for this expansion pack
        expansionDotFolder = path.join(installDir, `.${packId}`);
        await fileManager.ensureDirectory(expansionDotFolder);
        
        // Define the folders to copy from expansion packs
        const foldersToSync = [
          'agents',
          'agent-teams',
          'templates',
          'tasks',
          'checklists',
          'workflows',
          'data',
          'utils',
          'schemas'
        ];

        // Copy each folder if it exists
        for (const folder of foldersToSync) {
          const sourceFolder = path.join(expansionPackDir, folder);
          
          // Check if folder exists in expansion pack
          if (await fileManager.pathExists(sourceFolder)) {
            // Get all files in this folder
            const files = glob.sync('**/*', {
              cwd: sourceFolder,
              nodir: true
            });

            // Copy each file to the expansion pack's dot folder
            for (const file of files) {
              const sourcePath = path.join(sourceFolder, file);
              const destPath = path.join(expansionDotFolder, folder, file);
              
              if (await fileManager.copyFile(sourcePath, destPath)) {
                installedFiles.push(path.join(`.${packId}`, folder, file));
              }
            }
          }
        }

        // Copy config.yaml
        const configPath = path.join(expansionPackDir, 'config.yaml');
        if (await fileManager.pathExists(configPath)) {
          const configDestPath = path.join(expansionDotFolder, 'config.yaml');
          if (await fileManager.copyFile(configPath, configDestPath)) {
            installedFiles.push(path.join(`.${packId}`, 'config.yaml'));
          }
        }
        
        // Copy README if it exists
        const readmePath = path.join(expansionPackDir, 'README.md');
        if (await fileManager.pathExists(readmePath)) {
          const readmeDestPath = path.join(expansionDotFolder, 'README.md');
          if (await fileManager.copyFile(readmePath, readmeDestPath)) {
            installedFiles.push(path.join(`.${packId}`, 'README.md'));
          }
        }

        // Copy common/ items to expansion pack folder
        spinner.text = `Copying common utilities to ${packId}...`;
        await this.copyCommonItems(installDir, `.${packId}`, spinner);
        
        // Check and resolve core dependencies
        await this.resolveExpansionPackCoreDependencies(installDir, expansionDotFolder, packId, spinner);
        
        // Check and resolve core agents referenced by teams
        await this.resolveExpansionPackCoreAgents(installDir, expansionDotFolder, packId, spinner);

        // Create manifest for this expansion pack
        spinner.text = `Creating manifest for ${packId}...`;
        const expansionConfig = {
          installType: 'expansion-pack',
          expansionPackId: packId,
          expansionPackName: pack.name,
          expansionPackVersion: pack.version,
          ides: config.ides || []  // Use ides_setup instead of ide_setup
        };
        
        // Get all files installed in this expansion pack
        const expansionPackFiles = glob.sync('**/*', {
          cwd: expansionDotFolder,
          nodir: true
        }).map(f => path.join(`.${packId}`, f));
        
        await fileManager.createExpansionPackManifest(installDir, packId, expansionConfig, expansionPackFiles);

        console.log(chalk.green(`✓ Installed expansion pack: ${pack.name} to ${`.${packId}`}`));
      } catch (error) {
        console.error(chalk.red(`Failed to install expansion pack ${packId}: ${error.message}`));
        console.error(chalk.red(`Stack trace: ${error.stack}`));
      }
    }

    return installedFiles;
  }

  async resolveExpansionPackCoreDependencies(installDir, expansionDotFolder, packId, spinner) {
    const glob = require('glob');
    const yaml = require('js-yaml');
    const fs = require('fs').promises;
    
    // Find all agent files in the expansion pack
    const agentFiles = glob.sync('agents/*.md', {
      cwd: expansionDotFolder
    });

    for (const agentFile of agentFiles) {
      const agentPath = path.join(expansionDotFolder, agentFile);
      const agentContent = await fs.readFile(agentPath, 'utf8');
      
      // Extract YAML frontmatter to check dependencies
      const yamlContent = extractYamlFromAgent(agentContent);
      if (yamlContent) {
        try {
          const agentConfig = yaml.parse(yamlContent);
          const dependencies = agentConfig.dependencies || {};
          
          // Check for core dependencies (those that don't exist in the expansion pack)
          for (const depType of ['tasks', 'templates', 'checklists', 'workflows', 'utils', 'data']) {
            const deps = dependencies[depType] || [];
            
            for (const dep of deps) {
              const depFileName = dep.endsWith('.md') ? dep : `${dep}.md`;
              const expansionDepPath = path.join(expansionDotFolder, depType, depFileName);
              
              // Check if dependency exists in expansion pack
              if (!(await fileManager.pathExists(expansionDepPath))) {
                // Try to find it in core
                const coreDepPath = path.join(configLoader.getAiSquadCorePath(), depType, depFileName);
                
                if (await fileManager.pathExists(coreDepPath)) {
                  spinner.text = `Copying core dependency ${dep} for ${packId}...`;
                  
                  // Copy from core to expansion pack dot folder
                  const destPath = path.join(expansionDotFolder, depType, depFileName);
                  await fileManager.copyFile(coreDepPath, destPath);
                  
                  console.log(chalk.dim(`  Added core dependency: ${depType}/${depFileName}`));
                } else {
                  console.warn(chalk.yellow(`  Warning: Dependency ${depType}/${dep} not found in core or expansion pack`));
                }
              }
            }
          }
        } catch (error) {
          console.warn(chalk.yellow(`  Warning: Could not parse agent dependencies: ${error.message}`));
        }
      }
    }
  }

  async resolveExpansionPackCoreAgents(installDir, expansionDotFolder, packId, spinner) {
    const glob = require('glob');
    const yaml = require('js-yaml');
    const fs = require('fs').promises;
    
    // Find all team files in the expansion pack
    const teamFiles = glob.sync('agent-teams/*.yaml', {
      cwd: expansionDotFolder
    });

    // Also get existing agents in the expansion pack
    const existingAgents = new Set();
    const agentFiles = glob.sync('agents/*.md', {
      cwd: expansionDotFolder
    });
    for (const agentFile of agentFiles) {
      const agentName = path.basename(agentFile, '.md');
      existingAgents.add(agentName);
    }

    // Process each team file
    for (const teamFile of teamFiles) {
      const teamPath = path.join(expansionDotFolder, teamFile);
      const teamContent = await fs.readFile(teamPath, 'utf8');
      
      try {
        const teamConfig = yaml.parse(teamContent);
        const agents = teamConfig.agents || [];
        
        // Add ai-squad-orchestrator if not present (required for all teams)
        if (!agents.includes('ai-squad-orchestrator')) {
          agents.unshift('ai-squad-orchestrator');
        }
        
        // Check each agent in the team
        for (const agentId of agents) {
          if (!existingAgents.has(agentId)) {
            // Agent not in expansion pack, try to get from core
            const coreAgentPath = path.join(configLoader.getAiSquadCorePath(), 'agents', `${agentId}.md`);
            
            if (await fileManager.pathExists(coreAgentPath)) {
              spinner.text = `Copying core agent ${agentId} for ${packId}...`;
              
              // Copy agent file
              const destPath = path.join(expansionDotFolder, 'agents', `${agentId}.md`);
              await fileManager.copyFile(coreAgentPath, destPath);
              existingAgents.add(agentId);
              
              console.log(chalk.dim(`  Added core agent: ${agentId}`));
              
              // Now resolve this agent's dependencies too
              const agentContent = await fs.readFile(coreAgentPath, 'utf8');
              const yamlContent = extractYamlFromAgent(agentContent, true);
              
              if (yamlContent) {
                try {
                  
                  const agentConfig = yaml.parse(yamlContent);
                  const dependencies = agentConfig.dependencies || {};
                  
                  // Copy all dependencies for this agent
                  for (const depType of ['tasks', 'templates', 'checklists', 'workflows', 'utils', 'data']) {
                    const deps = dependencies[depType] || [];
                    
                    for (const dep of deps) {
                      const depFileName = dep.endsWith('.md') || dep.endsWith('.yaml') ? dep : `${dep}.md`;
                      const expansionDepPath = path.join(expansionDotFolder, depType, depFileName);
                      
                      // Check if dependency exists in expansion pack
                      if (!(await fileManager.pathExists(expansionDepPath))) {
                        // Try to find it in core
                        const coreDepPath = path.join(configLoader.getAiSquadCorePath(), depType, depFileName);
                        
                        if (await fileManager.pathExists(coreDepPath)) {
                          const destDepPath = path.join(expansionDotFolder, depType, depFileName);
                          await fileManager.copyFile(coreDepPath, destDepPath);
                          console.log(chalk.dim(`    Added agent dependency: ${depType}/${depFileName}`));
                        } else {
                          // Try common folder
                          const sourceBase = path.dirname(path.dirname(path.dirname(path.dirname(__filename)))); // Go up to project root
                          const commonDepPath = path.join(sourceBase, 'common', depType, depFileName);
                          if (await fileManager.pathExists(commonDepPath)) {
                            const destDepPath = path.join(expansionDotFolder, depType, depFileName);
                            await fileManager.copyFile(commonDepPath, destDepPath);
                            console.log(chalk.dim(`    Added agent dependency from common: ${depType}/${depFileName}`));
                          }
                        }
                      }
                    }
                  }
                } catch (error) {
                  console.warn(chalk.yellow(`  Warning: Could not parse agent ${agentId} dependencies: ${error.message}`));
                }
              }
            } else {
              console.warn(chalk.yellow(`  Warning: Core agent ${agentId} not found for team ${path.basename(teamFile, '.yaml')}`));
            }
          }
        }
      } catch (error) {
        console.warn(chalk.yellow(`  Warning: Could not parse team file ${teamFile}: ${error.message}`));
      }
    }
  }

  getWebBundleInfo(config) {
    const webBundleType = config.webBundleType || 'all';
    
    switch (webBundleType) {
      case 'all':
        return 'all bundles';
      case 'agents':
        return 'individual agents only';
      case 'teams':
        return config.selectedWebBundleTeams ? 
          `teams: ${config.selectedWebBundleTeams.join(', ')}` : 
          'selected teams';
      case 'custom':
        const parts = [];
        if (config.selectedWebBundleTeams && config.selectedWebBundleTeams.length > 0) {
          parts.push(`teams: ${config.selectedWebBundleTeams.join(', ')}`);
        }
        if (config.includeIndividualAgents) {
          parts.push('individual agents');
        }
        return parts.length > 0 ? parts.join(' + ') : 'custom selection';
      default:
        return 'selected bundles';
    }
  }

  async installWebBundles(webBundlesDirectory, config, spinner) {
    // Ensure modules are initialized
    await initializeModules();
    
    try {
      // Find the dist directory in the AI Squad installation
      const distDir = configLoader.getDistPath();
      
      if (!(await fileManager.pathExists(distDir))) {
        console.warn(chalk.yellow('Web bundles not found. Run "npm run build" to generate them.'));
        return;
      }

      // Ensure web bundles directory exists
      await fileManager.ensureDirectory(webBundlesDirectory);
      
      const webBundleType = config.webBundleType || 'all';
      
      if (webBundleType === 'all') {
        // Copy the entire dist directory structure
        await fileManager.copyDirectory(distDir, webBundlesDirectory);
        console.log(chalk.green(`✓ Installed all web bundles to: ${webBundlesDirectory}`));
      } else {
        let copiedCount = 0;
        
        // Copy specific selections based on type
        if (webBundleType === 'agents' || (webBundleType === 'custom' && config.includeIndividualAgents)) {
          const agentsSource = path.join(distDir, 'agents');
          const agentsTarget = path.join(webBundlesDirectory, 'agents');
          if (await fileManager.pathExists(agentsSource)) {
            await fileManager.copyDirectory(agentsSource, agentsTarget);
            console.log(chalk.green(`✓ Copied individual agent bundles`));
            copiedCount += 10; // Approximate count for agents
          }
        }
        
        if (webBundleType === 'teams' || webBundleType === 'custom') {
          if (config.selectedWebBundleTeams && config.selectedWebBundleTeams.length > 0) {
            const teamsSource = path.join(distDir, 'teams');
            const teamsTarget = path.join(webBundlesDirectory, 'teams');
            await fileManager.ensureDirectory(teamsTarget);
            
            for (const teamId of config.selectedWebBundleTeams) {
              const teamFile = `${teamId}.txt`;
              const sourcePath = path.join(teamsSource, teamFile);
              const targetPath = path.join(teamsTarget, teamFile);
              
              if (await fileManager.pathExists(sourcePath)) {
                await fileManager.copyFile(sourcePath, targetPath);
                copiedCount++;
                console.log(chalk.green(`✓ Copied team bundle: ${teamId}`));
              }
            }
          }
        }
        
        // Always copy expansion packs if they exist
        const expansionSource = path.join(distDir, 'expansion-packs');
        const expansionTarget = path.join(webBundlesDirectory, 'expansion-packs');
        if (await fileManager.pathExists(expansionSource)) {
          await fileManager.copyDirectory(expansionSource, expansionTarget);
          console.log(chalk.green(`✓ Copied expansion pack bundles`));
        }
        
        console.log(chalk.green(`✓ Installed ${copiedCount} selected web bundles to: ${webBundlesDirectory}`));
      }
    } catch (error) {
      console.error(chalk.red(`Failed to install web bundles: ${error.message}`));
    }
  }

  async copyCommonItems(installDir, targetSubdir, spinner) {
    // Ensure modules are initialized
    await initializeModules();
    
    const glob = require('glob');
    const fs = require('fs').promises;
    const sourceBase = path.dirname(path.dirname(path.dirname(path.dirname(__filename)))); // Go up to project root
    const commonPath = path.join(sourceBase, 'common');
    const targetPath = path.join(installDir, targetSubdir);
    const copiedFiles = [];
    
    // Check if common/ exists
    if (!(await fileManager.pathExists(commonPath))) {
      console.warn(chalk.yellow('Warning: common/ folder not found'));
      return copiedFiles;
    }
    
    // Copy all items from common/ to target
    const commonItems = glob.sync('**/*', {
      cwd: commonPath,
      nodir: true
    });
    
    for (const item of commonItems) {
      const sourcePath = path.join(commonPath, item);
      const destPath = path.join(targetPath, item);
      
      // Read the file content
      const content = await fs.readFile(sourcePath, 'utf8');
      
      // Replace {root} with the target subdirectory
      const updatedContent = content.replace(/\{root\}/g, targetSubdir);
      
      // Ensure directory exists
      await fileManager.ensureDirectory(path.dirname(destPath));
      
      // Write the updated content
      await fs.writeFile(destPath, updatedContent, 'utf8');
      copiedFiles.push(path.join(targetSubdir, item));
    }
    
    console.log(chalk.dim(`  Added ${commonItems.length} common utilities`));
    return copiedFiles;
  }

  async detectExpansionPacks(installDir) {
    const expansionPacks = {};
    const glob = require("glob");
    
    // Find all dot folders that might be expansion packs
    const dotFolders = glob.sync(".*", {
      cwd: installDir,
      ignore: [".git", ".git/**", ".ai-squad-core", ".ai-squad-core/**"],
    });
    
    for (const folder of dotFolders) {
      const folderPath = path.join(installDir, folder);
      const stats = await fileManager.pathExists(folderPath);
      
      if (stats) {
        // Check if it has a manifest
        const manifestPath = path.join(folderPath, "install-manifest.yaml");
        if (await fileManager.pathExists(manifestPath)) {
          const manifest = await fileManager.readExpansionPackManifest(installDir, folder.substring(1));
          if (manifest) {
            expansionPacks[folder.substring(1)] = {
              path: folderPath,
              manifest: manifest,
              hasManifest: true
            };
          }
        } else {
          // Check if it has a config.yaml (expansion pack without manifest)
          const configPath = path.join(folderPath, "config.yaml");
          if (await fileManager.pathExists(configPath)) {
            expansionPacks[folder.substring(1)] = {
              path: folderPath,
              manifest: null,
              hasManifest: false
            };
          }
        }
      }
    }
    
    return expansionPacks;
  }

  async repairExpansionPack(installDir, packId, pack, integrity, spinner) {
    spinner.start(`Repairing ${pack.name}...`);
    
    try {
      const expansionDotFolder = path.join(installDir, `.${packId}`);
      
      // Back up modified files
      if (integrity.modified.length > 0) {
        spinner.text = "Backing up modified files...";
        for (const file of integrity.modified) {
          const filePath = path.join(installDir, file);
          if (await fileManager.pathExists(filePath)) {
            const backupPath = await fileManager.backupFile(filePath);
            console.log(chalk.dim(`  Backed up: ${file} → ${path.basename(backupPath)}`));
          }
        }
      }
      
      // Restore missing and modified files
      spinner.text = "Restoring files...";
      const filesToRestore = [...integrity.missing, ...integrity.modified];
      
      for (const file of filesToRestore) {
        // Skip the manifest file itself
        if (file.endsWith('install-manifest.yaml')) continue;
        
        const relativePath = file.replace(`.${packId}/`, '');
        const sourcePath = path.join(pack.packPath, relativePath);
        const destPath = path.join(installDir, file);
        
        // Check if this is a common/ file that needs special processing
        const commonBase = path.dirname(path.dirname(path.dirname(path.dirname(__filename))));
        const commonSourcePath = path.join(commonBase, 'common', relativePath);
        
        if (await fileManager.pathExists(commonSourcePath)) {
          // This is a common/ file - needs template processing
          const fs = require('fs').promises;
          const content = await fs.readFile(commonSourcePath, 'utf8');
          const updatedContent = content.replace(/\{root\}/g, `.${packId}`);
          await fileManager.ensureDirectory(path.dirname(destPath));
          await fs.writeFile(destPath, updatedContent, 'utf8');
          spinner.text = `Restored: ${file}`;
        } else if (await fileManager.pathExists(sourcePath)) {
          // Regular file from expansion pack
          await fileManager.copyFile(sourcePath, destPath);
          spinner.text = `Restored: ${file}`;
        } else {
          console.warn(chalk.yellow(`  Warning: Source file not found: ${file}`));
        }
      }
      
      spinner.succeed(`${pack.name} repaired successfully!`);
      
      // Show summary
      console.log(chalk.green(`\n✓ ${pack.name} repaired!`));
      if (integrity.missing.length > 0) {
        console.log(chalk.green(`  Restored ${integrity.missing.length} missing files`));
      }
      if (integrity.modified.length > 0) {
        console.log(chalk.green(`  Restored ${integrity.modified.length} modified files (backups created)`));
      }
      
    } catch (error) {
      spinner.fail(`Failed to repair ${pack.name}`);
      console.error(chalk.red(`Error: ${error.message}`));
    }
  }

  compareVersions(v1, v2) {
    // Simple semver comparison
    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);
    
    for (let i = 0; i < 3; i++) {
      const part1 = parts1[i] || 0;
      const part2 = parts2[i] || 0;
      
      if (part1 > part2) return 1;
      if (part1 < part2) return -1;
    }
    
    return 0;
  }

  async cleanupLegacyYmlFiles(installDir, spinner) {
    const glob = require('glob');
    const fs = require('fs').promises;
    
    try {
      // Find all .yml files in the installation directory
      const ymlFiles = glob.sync('**/*.yml', {
        cwd: installDir,
        ignore: ['**/node_modules/**', '**/.git/**']
      });
      
      let deletedCount = 0;
      
      for (const ymlFile of ymlFiles) {
        // Check if corresponding .yaml file exists
        const yamlFile = ymlFile.replace(/\.yml$/, '.yaml');
        const ymlPath = path.join(installDir, ymlFile);
        const yamlPath = path.join(installDir, yamlFile);
        
        if (await fileManager.pathExists(yamlPath)) {
          // .yaml counterpart exists, delete the .yml file
          await fs.unlink(ymlPath);
          deletedCount++;
          console.log(chalk.dim(`  Removed legacy: ${ymlFile} (replaced by ${yamlFile})`));
        }
      }
      
      if (deletedCount > 0) {
        console.log(chalk.green(`✓ Cleaned up ${deletedCount} legacy .yml files`));
      }
      
    } catch (error) {
      console.warn(chalk.yellow(`Warning: Could not cleanup legacy .yml files: ${error.message}`));
    }
  }

  async findInstallation() {
    // Look for .ai-squad-core in current directory or parent directories
    let currentDir = process.cwd();

    while (currentDir !== path.dirname(currentDir)) {
      const aiSquadDir = path.join(currentDir, ".ai-squad-core");
      const manifestPath = path.join(aiSquadDir, "install-manifest.yaml");

      if (await fileManager.pathExists(manifestPath)) {
        return aiSquadDir;
      }

      currentDir = path.dirname(currentDir);
    }

    // Also check if we're inside a .ai-squad-core directory
    if (path.basename(process.cwd()) === ".ai-squad-core") {
      const manifestPath = path.join(process.cwd(), "install-manifest.yaml");
      if (await fileManager.pathExists(manifestPath)) {
        return process.cwd();
      }
    }

    return null;
  }
}

module.exports = new Installer();
