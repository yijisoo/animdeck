* # Machine Learning Fundamentals {logo: KAIST}
  * A Practical Introduction
  * Ji Soo Yi
  * Department of Computer Science
  * Spring 2026
* ## What is Machine Learning?
* Defining Machine Learning
  * A system **learns from data** rather than following explicit rules
  * ++ **Supervised learning** -- learn from labeled examples
    * Classification: predict a category
    * Regression: predict a number
  * ++ **Unsupervised learning** -- find structure in unlabeled data
    * Clustering, dimensionality reduction
  * ++ **Reinforcement learning** -- learn by reward and penalty
  * > "A computer program is said to learn from experience E with respect to task T." -- Tom Mitchell
  * [1] Mitchell, T. (1997). Machine Learning. McGraw-Hill.
* ## Supervised Learning
* The Training Pipeline
  * Raw data enters a **preprocessing** step
  * ++ Features are extracted and normalized
  * ++ A model is trained by minimizing a **loss function**
    * Loss = gap between prediction and ground truth
  * ++ The trained model is evaluated on a held-out **test set**
  * ++ Repeat: tune hyperparameters, retrain, re-evaluate
* Linear vs Polynomial Regression
  * ++ **Linear regression** -- fits a straight line through data points
    * Works well when the relationship is approximately linear
    * Low variance, can have high bias
  * ++ **Polynomial regression** -- fits a curve
    * Captures non-linear patterns
    * Risk of overfitting with high-degree polynomials
  * ++ **Regularization** adds a penalty term to reduce overfitting
  * [1] Hastie et al. (2009). The Elements of Statistical Learning.
* ## Model Evaluation
* |vs| Underfitting vs Overfitting
  * High bias
  * Fails on training data
  * Too simple a model
  * Fix: increase model complexity
  * ---
  * High variance
  * Fails only on test data
  * Memorized training set
  * Fix: more data or regularization
* Evaluation Metrics
  * For **classification** tasks
    * ++ Accuracy -- fraction of correct predictions
    * ++ Precision / Recall -- when classes are imbalanced
    * ++ F1 score -- harmonic mean of precision and recall
  * ---
  * For **regression** tasks
    * ++ MAE -- mean absolute error, easy to interpret
    * ++ RMSE -- root mean squared error, penalizes large errors
    * ++ R² -- proportion of variance explained
* ## Summary
* Key Takeaways
  * ++ Machine learning = learning patterns from data, not programming rules
  * ++ Supervised learning requires labeled examples
  * ++ Always split data: training / validation / test
  * ++ Watch for underfitting (too simple) and overfitting (too complex)
  * > "In God we trust. All others must bring data." -- W. Edwards Deming
