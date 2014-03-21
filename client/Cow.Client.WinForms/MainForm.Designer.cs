namespace Cow.Client.WinForms
{
    partial class MainForm
    {
        /// <summary>
        /// Required designer variable.
        /// </summary>
        private System.ComponentModel.IContainer components = null;

        /// <summary>
        /// Clean up any resources being used.
        /// </summary>
        /// <param name="disposing">true if managed resources should be disposed; otherwise, false.</param>
        protected override void Dispose(bool disposing)
        {
            if (disposing && (components != null))
            {
                components.Dispose();
            }
            base.Dispose(disposing);
        }

        #region Windows Form Designer generated code

        /// <summary>
        /// Required method for Designer support - do not modify
        /// the contents of this method with the code editor.
        /// </summary>
        private void InitializeComponent()
        {
            this.tbMessages = new System.Windows.Forms.TextBox();
            this.btnConnect = new System.Windows.Forms.Button();
            this.tbUrl = new System.Windows.Forms.TextBox();
            this.label1 = new System.Windows.Forms.Label();
            this.label2 = new System.Windows.Forms.Label();
            this.label3 = new System.Windows.Forms.Label();
            this.lblMessagesCounter = new System.Windows.Forms.Label();
            this.btnSyncUsers = new System.Windows.Forms.Button();
            this.btnPeers = new System.Windows.Forms.Button();
            this.btnProjects = new System.Windows.Forms.Button();
            this.btnGroups = new System.Windows.Forms.Button();
            this.items = new System.Windows.Forms.Button();
            this.SuspendLayout();
            // 
            // tbMessages
            // 
            this.tbMessages.Location = new System.Drawing.Point(61, 128);
            this.tbMessages.Multiline = true;
            this.tbMessages.Name = "tbMessages";
            this.tbMessages.ScrollBars = System.Windows.Forms.ScrollBars.Vertical;
            this.tbMessages.Size = new System.Drawing.Size(1096, 411);
            this.tbMessages.TabIndex = 0;
            // 
            // btnConnect
            // 
            this.btnConnect.Location = new System.Drawing.Point(1082, 70);
            this.btnConnect.Name = "btnConnect";
            this.btnConnect.Size = new System.Drawing.Size(75, 23);
            this.btnConnect.TabIndex = 1;
            this.btnConnect.Text = "Connect";
            this.btnConnect.UseVisualStyleBackColor = true;
            this.btnConnect.Click += new System.EventHandler(this.btnConnect_Click);
            // 
            // tbUrl
            // 
            this.tbUrl.Location = new System.Drawing.Point(136, 67);
            this.tbUrl.Name = "tbUrl";
            this.tbUrl.Size = new System.Drawing.Size(924, 22);
            this.tbUrl.TabIndex = 2;
            this.tbUrl.Text = "http://wingis/cow/signalr";
            // 
            // label1
            // 
            this.label1.AutoSize = true;
            this.label1.Location = new System.Drawing.Point(58, 70);
            this.label1.Name = "label1";
            this.label1.Size = new System.Drawing.Size(82, 17);
            this.label1.TabIndex = 3;
            this.label1.Text = "Cow server:";
            // 
            // label2
            // 
            this.label2.AutoSize = true;
            this.label2.Font = new System.Drawing.Font("Microsoft Sans Serif", 16.2F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.label2.Location = new System.Drawing.Point(61, 13);
            this.label2.Name = "label2";
            this.label2.Size = new System.Drawing.Size(146, 32);
            this.label2.TabIndex = 4;
            this.label2.Text = "Cow client";
            // 
            // label3
            // 
            this.label3.AutoSize = true;
            this.label3.Location = new System.Drawing.Point(483, 27);
            this.label3.Name = "label3";
            this.label3.Size = new System.Drawing.Size(76, 17);
            this.label3.TabIndex = 5;
            this.label3.Text = "Messages:";
            // 
            // lblMessagesCounter
            // 
            this.lblMessagesCounter.AutoSize = true;
            this.lblMessagesCounter.Location = new System.Drawing.Point(566, 27);
            this.lblMessagesCounter.Name = "lblMessagesCounter";
            this.lblMessagesCounter.Size = new System.Drawing.Size(0, 17);
            this.lblMessagesCounter.TabIndex = 6;
            // 
            // btnSyncUsers
            // 
            this.btnSyncUsers.Location = new System.Drawing.Point(61, 99);
            this.btnSyncUsers.Name = "btnSyncUsers";
            this.btnSyncUsers.Size = new System.Drawing.Size(146, 23);
            this.btnSyncUsers.TabIndex = 7;
            this.btnSyncUsers.Text = "users";
            this.btnSyncUsers.UseVisualStyleBackColor = true;
            this.btnSyncUsers.Click += new System.EventHandler(this.btnSyncUsers_Click);
            // 
            // btnPeers
            // 
            this.btnPeers.Location = new System.Drawing.Point(214, 99);
            this.btnPeers.Name = "btnPeers";
            this.btnPeers.Size = new System.Drawing.Size(75, 23);
            this.btnPeers.TabIndex = 8;
            this.btnPeers.Text = "peers";
            this.btnPeers.UseVisualStyleBackColor = true;
            this.btnPeers.Click += new System.EventHandler(this.btnPeers_Click);
            // 
            // btnProjects
            // 
            this.btnProjects.Location = new System.Drawing.Point(296, 99);
            this.btnProjects.Name = "btnProjects";
            this.btnProjects.Size = new System.Drawing.Size(75, 23);
            this.btnProjects.TabIndex = 9;
            this.btnProjects.Text = "projecten";
            this.btnProjects.UseVisualStyleBackColor = true;
            this.btnProjects.Click += new System.EventHandler(this.btnProjects_Click);
            // 
            // btnGroups
            // 
            this.btnGroups.Location = new System.Drawing.Point(378, 98);
            this.btnGroups.Name = "btnGroups";
            this.btnGroups.Size = new System.Drawing.Size(75, 23);
            this.btnGroups.TabIndex = 10;
            this.btnGroups.Text = "groups";
            this.btnGroups.UseVisualStyleBackColor = true;
            this.btnGroups.Click += new System.EventHandler(this.button1_Click);
            // 
            // items
            // 
            this.items.Location = new System.Drawing.Point(460, 98);
            this.items.Name = "items";
            this.items.Size = new System.Drawing.Size(75, 23);
            this.items.TabIndex = 11;
            this.items.Text = "items";
            this.items.UseVisualStyleBackColor = true;
            this.items.Click += new System.EventHandler(this.items_Click);
            // 
            // MainForm
            // 
            this.AutoScaleDimensions = new System.Drawing.SizeF(8F, 16F);
            this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
            this.ClientSize = new System.Drawing.Size(1189, 565);
            this.Controls.Add(this.items);
            this.Controls.Add(this.btnGroups);
            this.Controls.Add(this.btnProjects);
            this.Controls.Add(this.btnPeers);
            this.Controls.Add(this.btnSyncUsers);
            this.Controls.Add(this.lblMessagesCounter);
            this.Controls.Add(this.label3);
            this.Controls.Add(this.label2);
            this.Controls.Add(this.label1);
            this.Controls.Add(this.tbUrl);
            this.Controls.Add(this.btnConnect);
            this.Controls.Add(this.tbMessages);
            this.Name = "MainForm";
            this.Text = "Cow";
            this.ResumeLayout(false);
            this.PerformLayout();

        }

        #endregion

        private System.Windows.Forms.TextBox tbMessages;
        private System.Windows.Forms.Button btnConnect;
        private System.Windows.Forms.TextBox tbUrl;
        private System.Windows.Forms.Label label1;
        private System.Windows.Forms.Label label2;
        private System.Windows.Forms.Label label3;
        private System.Windows.Forms.Label lblMessagesCounter;
        private System.Windows.Forms.Button btnSyncUsers;
        private System.Windows.Forms.Button btnPeers;
        private System.Windows.Forms.Button btnProjects;
        private System.Windows.Forms.Button btnGroups;
        private System.Windows.Forms.Button items;
    }
}

