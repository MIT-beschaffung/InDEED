# base image has CPLEX Studio 129 installed
FROM jfffe/indeed_optimizer_base_image

# add CPLEX install dir to ENV
ENV PYTHONPATH=/opt/ibm/ILOG/CPLEX_Studio129/cplex/python/3.7/x86-64_linux

# copy files defining the python environment
WORKDIR /indeed_optimizer
COPY Pipfile .
COPY Pipfile.lock .
# install the python environment
RUN pipenv install

# copy file contents into container
COPY ./app ./app
# remove old database which might be left over from previous runs
RUN rm -f ./app/last_values.db
RUN rm -f ./last_values.db

# run application
CMD pipenv run python ./app/main.py